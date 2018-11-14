# -*- coding: utf-8 -*-
'''
Created on 2018. 10. 29.
@author: Hyechurn Jang, <hyjang@cisco.com>
'''

import os
import uuid
import time
import json
import requests
from pygics import rest, Burst, Lock, Task, Queue
from engine.asdm import ASDM
from engine.webfile import file

ENGINE_HOST = 'localhost'
HISTORY_DIR = './history'

class HistoryManager(Task):
    
    def __init__(self, history_dir):
        Task.__init__(self)
        self.history_dir = history_dir
        self.queue = Queue()
        if not os.path.exists(history_dir): os.mkdir(history_dir)
        self.start()
    
    def getHistories(self):
        files = os.listdir(self.history_dir)
        files.reverse()
        return [file.replace('.json', '') for file in files]
    
    def getHistoryDetail(self, id):
        with open('%s/%s.json' % (self.history_dir, id), 'r') as fd: return json.loads(fd.read())
    
    def delHistory(self, id):
        path = '%s/%s.json' % (self.history_dir, id)
        if os.path.exists(path): os.remove(path)
        return {'deleted' : path}
    
    def addHistory(self, tstr, data):
        self.queue.put((tstr, data))
        
    def __run__(self):
        tstr, data = self.queue.get()
        with open('%s/%s.json' % (self.history_dir, tstr), 'w') as fd: fd.write(json.dumps(data))

hm = HistoryManager(HISTORY_DIR)

class TaskManager(Task):
    
    def __init__(self, engine_host):
        Task.__init__(self)
        self.engine_host = engine_host
        self.base_url = 'http://%s/api/' % self.engine_host
        self.init_queue = Queue()
        self.lock = Lock()
        self.progress = 100
        self.task_error = None
        self.task = []
        self.start()
    
    def getResult(self):
        return self.task
    
    def getStatus(self):
        if self.task_error: status = 'error'
        elif self.progress < 100: status = 'running'
        else: status = 'ready'
        ret = {'status' : status}
        if status == 'error': ret['error'] = self.task_error
        elif status == 'running': ret['progress'] = self.progress
        return ret
    
    def request(self, desc):
        if self.lock.on(block=False):
            self.task = []
            self.progress = 0.0
            self.task_error = None
            self.init_queue.put(desc)
        return self.getStatus()
    
    def release(self, task):
        self.task = task
        self.progress = 100
        self.task_error = None
        self.lock.off()
        
    def corrupt(self, e):
        self.task = []
        self.progress = 100
        self.task_error = str(e)
        self.lock.off()
    
    def __run__(self):
        desc = self.init_queue.get()
        if 'pool_id' in desc and desc['pool_id']:
            try:
                resp = requests.get(self.base_url + 'pool/%s' % desc['pool_id'])
                devices = resp.json()['devices']
            except Exception as e:
                return self.corrupt(e)
        elif 'device_id' in desc and desc['device_id']:
            try:
                resp = requests.get(self.base_url + 'device/%s' % desc['device_id'])
                devices = [resp.json()]
            except Exception as e:
                return self.corrupt(e)
        else: return self.corrupt('must be needed device_id or pool_id')
        self.progress += 10.0
        if 'workflow_id' in desc and desc['workflow_id']:
            try:
                resp = requests.get(self.base_url + 'workflow/%s' % desc['workflow_id'])
                commands = resp.json()['commands']
            except Exception as e:
                return self.corrupt(e)
        elif 'command_id' in desc and desc['command_id']:
            try:
                resp = requests.get(self.base_url + 'command/%s' % desc['command_id'])
                commands = [resp.json()]
            except Exception as e:
                return self.corrupt(e)
        else: return self.corrupt('must be needed command_id or workflow_id')
        self.progress += 10.0
        if 'vars' in desc: vars = desc['vars']
        else: vars = []
        var_count = 0
        for command in commands:
            var_count += len(command['vars'])
        if len(vars) != var_count:
            return self.corrupt('variable count not match')
        asdm_list = [ASDM(**device) for device in devices]
        task = [{'id' : device['id'], 'name' : device['name'],  'commands' : []} for device in devices]
        device_count = len(devices)
        var_index = 0
        progress_increase = 80 / (len(commands) * len(asdm_list) * 1.2);
        for command in commands:
            command_id = command['id']
            command_name = command['name']
            command_text = command['text']
            command_vars = command['vars']
            for command_var in command_vars:
                command_text = command_text.replace('{%s}' % command_var, vars[var_index])
                var_index += 1
            burst = Burst()
            for asdm in asdm_list: burst.register(asdm.cli, command_text)
            output_list = burst.do()
            for i in range(0, device_count):
                output_data = output_list[i]
                if isinstance(output_data, list):
                    task[i]['commands'].append({
                        'id' : command_id,
                        'job_id' : '%s-%d' % (command_id, i),
                        'name' : command_name,
                        'result' : output_list[i]
                    })
                else:
                    task[i]['commands'].append({
                        'id' : command_id,
                        'job_id' : '%s-%d' % (command_id, i),
                        'name' : command_name,
                        'result' : [['[ERROR] %s' % str(output_data)]]
                    })
                    task[i]['error'] = True
                if self.progress + progress_increase < 100.0: self.progress += progress_increase
        self.release(task)
        hm.addHistory(time.strftime('%Y%m%d-%H%M%S'), task)

tm = TaskManager(ENGINE_HOST)

@file('/')
def getFile(req, *path):
    if not path: return open('web/index.html', 'rb')
    else: return open('web/%s' % '/'.join(path), 'rb')

@rest('GET', '/history')
def getHistory(req, id=None):
    if id: return hm.getHistoryDetail(id)
    else: return hm.getHistories()

@rest('DELETE', '/history')
def delHistory(req, id):
    return hm.delHistory(id)

@rest('GET', '/task/result')
def getTaskResult(req):
    return tm.getResult()

@rest('GET', '/task/status')
def getTaskStatus(req):
    return tm.getStatus()

@rest('POST', '/task/request')
def requestTask(req):
    return tm.request(req.data)
