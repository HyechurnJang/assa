# -*- coding: utf-8 -*-
'''
Created on 2018. 10. 29.
@author: Hyechurn Jang, <hyjang@cisco.com>
'''

import re
import json
import uuid
import base64
import ipaddress
from pygics import Lock

ACCOUNT_FILE = 'table_accounts.json'
DEVICE_FILE = 'table_devices.json'
POOL_FILE = 'table_pools.json'
COMMAND_FILE = 'table_commands.json'
WORKFLOW_FILE = 'table_workflow.json'

DEFAULT_PORT = 443

class ResourceManager(dict):
    
    def __init__(self):
        try:
            with open(ACCOUNT_FILE, 'r') as fd: accounts_data = json.loads(fd.read())
        except: accounts_data = {}
        try:
            with open(DEVICE_FILE, 'r') as fd: devices_data = json.loads(fd.read())
        except: devices_data = {}
        try:
            with open(POOL_FILE, 'r') as fd: pools_data = json.loads(fd.read())
        except: pools_data = {}
        try:
            with open(COMMAND_FILE, 'r') as fd: commands_data = json.loads(fd.read())
        except: commands_data = {}
        try:
            with open(WORKFLOW_FILE, 'r') as fd: workflow_data = json.loads(fd.read())
        except: workflow_data = {}
        resource_data = {
            'accounts' : accounts_data,
            'devices' : devices_data,
            'pools' : pools_data,
            'commands' : commands_data,
            'workflows' : workflow_data
        }
        dict.__init__(self, **resource_data)
        self._accounts = self['accounts']
        self._devices = self['devices']
        self._pools = self['pools']
        self._commands = self['commands']
        self._workflows = self['workflows']
        self._hqdev = self.findHQDevice()
        self._lock = Lock()
    
    def lock(self): self._lock.on()
    
    def unlock(self): self._lock.off()
    
    def writeToFile(self):
        self.writeAccounts()
        self.writeDevices()
        self.writePools()
        self.writeCommands()
        self.writeWorkFlows()
    
    def writeAccounts(self):
        with open(ACCOUNT_FILE, 'w') as fd: fd.write(json.dumps(self['accounts']))
        
    def writeDevices(self):
        with open(DEVICE_FILE, 'w') as fd: fd.write(json.dumps(self['devices']))
    
    def writePools(self):
        with open(POOL_FILE, 'w') as fd: fd.write(json.dumps(self['pools']))
    
    def writeCommands(self):
        with open(COMMAND_FILE, 'w') as fd: fd.write(json.dumps(self['commands']))
    
    def writeWorkFlows(self):
        with open(WORKFLOW_FILE, 'w') as fd: fd.write(json.dumps(self['workflows']))
    
    def deleteAllResource(self):
        self['accounts'] = {}
        self['devices'] = {}
        self['pools'] = {}
        self['commands'] = {}
        self['workflows'] = {}
        self._accounts = self['accounts']
        self._devices = self['devices']
        self._pools = self['pools']
        self._commands = self['commands']
        self._workflows = self['workflows']
        self.writeToFile()
    
    #===========================================================================
    # Account
    #===========================================================================
    def getAccounts(self):
        return [{'id' : account['id'], 'name' : account['name']} for account in self._accounts.values()]
    
    def getAccountDetail(self, id):
        if id not in self._accounts: raise Exception('%s is not in accounts' % id)
        return self._accounts[id]
    
    def getAccountByData(self, username, password):
        for account in self._accounts.values():
            if username == account['username'] and password == account['password']: return account
        raise Exception('%s/%s is not in accounts' % (username, password))
    
    def getAccountTable(self):
        return {
            'data' : [{
                'name': '''<span class="clickable" onclick="showAccount('%s');">%s</span>''' % (account['id'], account['name']),
                'check' : '''<input class="account-delete-selected" type="checkbox" account_id="%s">''' % (account['id']),
                'username' : account['username'],
                'password' : '****',
                'token' : '****'
                } for account in self._accounts.values()]}
    
    def addAccount(self, username, password, name=None, _lock=True):
        try: self.getAccountByData(username, password)
        except: pass
        else: raise Exception('%s/%s is already exist' % (username, password))
        if not name: name = username
        token = base64.b64encode(('%s:%s' % (username, password)).encode()).decode()
        id = str(uuid.uuid4())
        account = {
            'id' : id,
            'name' : name,
            'username' : username,
            'password' : password,
            'token' : token
        }
        if _lock: self.lock()
        self._accounts[id] = account
        self.writeAccounts()
        if _lock: self.unlock()
        return account
    
    def editAccount(self, id, username=None, password=None, name=None):
        if id not in self._accounts: raise Exception('%s is not in accounts' % id)
        self.lock()
        account = self._accounts[id]
        change_token = False
        if username:
            account['username'] = username
            change_token = True
        if password:
            account['password'] = password
            change_token = True
        if name: account['name'] = name
        if change_token:
            token = base64.b64encode(('%s:%s' % (account['username'], account['password'])).encode()).decode()
            account['token'] = token
        self.writeAccounts()
        self.unlock()
        return account
    
    def delAccount(self, id):
        if id not in self._accounts: raise Exception('%s is not in accounts' % id)
        self.lock()
        account = self._accounts.pop(id)
        self.writeAccounts()
        self.unlock()
        return account
    
    def delAccounts(self, id):
        if isinstance(id, str): id = [id]
        self.lock()
        for i in id:
            if i in self._accounts: self._accounts.pop(i)
        self.writeAccounts()
        self.unlock()
        return id
    
    #===========================================================================
    # Device
    #===========================================================================
    def findHQDevice(self):
        for device in self._devices.values():
            if device['headquater']: return device
        return self.getNonHQDevice()
    
    def getNonHQDevice(self): return {'id' : '', 'name' : '', 'ip' : '', 'port' : '', 'dp_ip' : '', 'vpn_net' : '', 'account_id' : '', 'account' : {'name' : '', 'username' : '', 'password' : '', 'token' : ''}}
    
    def getHQDevice(self):
        if self._hqdev['id']: return self.getDeviceDetail(self._hqdev['id'])
        return self._hqdev
    
    def getDevices(self):
        return [{'id' : device['id'], 'name' : device['name'], 'ip' : device['ip'], 'dp_ip' : device['dp_ip'], 'vpn_net' : device['vpn_net']} for device in self._devices.values()]
    
    def getDeviceDetail(self, id):
        if id not in self._devices: raise Exception('%s is not in devices' % id)
        device = self._devices[id]
        if device['account_id']:
            try: account = self.getAccountDetail(device['account_id'])
            except:
                self.lock()
                device['account_id'] = ''
                self.writeDevices()
                self.unlock()
                account = None
        else: account = None
        ret = {
            'id' : id,
            'name' : device['name'],
            'ip' : device['ip'],
            'port' : device['port'],
            'dp_ip' : device['dp_ip'],
            'vpn_net' : device['vpn_net'],
            'account_id' : device['account_id'],
            'headquater' : device['headquater']
        }
        if account: ret['account'] = account
        else: ret['account'] = {'name' : '', 'username' : '', 'password' : '', 'token' : ''}
        return ret
    
    def getDeviceByData(self, ip, port):
        for device in self._devices.values():
            if ip == device['ip'] and port == device['port']: return device
        raise Exception('%s:%d is not in devices' % (ip, port))
    
    def getDeviceTable(self):
        data = []
        for device_id in self._devices:
            device = self.getDeviceDetail(device_id)
            data.append({
                'name' : '''<span class="clickable" onclick="showDevice('%s');">%s</span>''' % (device['id'], device['name']),
                'check' : '''<input class="device-delete-selected" type="checkbox" device_id="%s">''' % (device['id']),
                'ip' : device['ip'],
                'port' : device['port'],
                'dp_ip' : device['dp_ip'],
                'vpn_net' : device['vpn_net'],
                'account' : device['account']['name'],
                'headquater': 'HQ' if device['headquater'] else 'CPE'
            })
        return {'data' : data}
    
    def addDevice(self, ip, port=None, dp_ip=None, vpn_net=None, name=None, account_id=None, username=None, password=None, headquater=None):
        if not port: port = DEFAULT_PORT
        if isinstance(port, str): port = int(port)
        try: self.getDeviceByData(ip, port)
        except: pass
        else: raise Exception('%s:%d is already exist' % (ip, port))
        if account_id:
            if account_id not in self._accounts: raise Exception('%s is not in accounts' % id)
        elif username and password:
            try: account = self.addAccount(username, password, _lock=False)
            except: account = self.getAccountByData(username, password)
            account_id = account['id']
        else: raise Exception('incompleted parameters')
        ip = str(ipaddress.ip_address(ip))
        if dp_ip: dp_ip = str(ipaddress.ip_address(dp_ip))
        else: dp_ip = ip
        if vpn_net: vpn_net = str(ipaddress.ip_network(vpn_net))
        else: vpn_net = ''
        if not name: name = '%s:%d' % (ip, port)
        if not headquater: headquater = False
        else: headquater = True
        id = str(uuid.uuid4())
        device = {
            'id' : id,
            'account_id' : account_id,
            'name' : name,
            'ip' : ip,
            'port' : port,
            'dp_ip' : dp_ip,
            'vpn_net' : vpn_net,
            'headquater' : headquater 
        }
        self.lock()
        self._devices[id] = device
        if headquater: self._hqdev = device
        self.writeDevices()
        self.unlock()
        return device
    
    def editDevice(self, id, ip=None, port=None, dp_ip=None, vpn_net=None, name=None, account_id=None, username=None, password=None, headquater=None):
        if id not in self._devices: raise Exception('%s is not in devices' % id)
        self.lock()
        device = self._devices[id]
        if account_id:
            if account_id not in self._accounts:
                self.unlock()
                raise Exception('%s is not in accounts' % id)
            device['account_id'] = account_id
        elif username and password:
            try: account = self.addAccount(username, password, _lock=False)
            except: account = self.getAccountByData(username, password)
            device['account_id'] = account['id']
        if ip:
            try: device['ip'] = str(ipaddress.ip_address(ip))
            except: pass
        if port:
            if isinstance(port, str): port = int(port)
            device['port'] = port
        if dp_ip:
            try: device['dp_ip'] = str(ipaddress.ip_address(dp_ip))
            except: pass
        if vpn_net:
            try: device['vpn_net'] = str(ipaddress.ip_network(vpn_net))
            except: pass
        if name: device['name'] = name
        if not headquater: headquater = False
        else: headquater = True
        if device['headquater'] == False and headquater == True:
            if self._hqdev['id'] != id: self._hqdev['headquater'] = False
            self._hqdev = device
        elif device['headquater'] == True and headquater == False:
            self._hqdev = self.getNonHQDevice()
        device['headquater'] = headquater
        self.writeDevices()
        self.unlock()
        return device
    
    def delDevice(self, id):
        if id not in self._devices: raise Exception('%s is not in devices' % id)
        self.lock()
        device = self._devices.pop(id)
        if device['headquater']: self._hqdev = self.getNonHQDevice()
        self.writeDevices()
        self.unlock()
        return device
    
    def delDevices(self, id):
        if isinstance(id, str): id = [id]
        self.lock()
        for i in id:
            if i in self._devices:
                device = self._devices.pop(i)
                if device['headquater']: self._hqdev = self.getNonHQDevice()
        self.writeDevices()
        self.unlock()
        return id
    
    #===========================================================================
    # Pool
    #===========================================================================
    def getPools(self):
        return [pool for pool in self._pools.values()]
    
    def getPoolDetail(self, id):
        if id not in self._pools: raise Exception('%s is not in pools' % id)
        pool = self._pools[id]
        devices = []
        devices_checked = []
        result = {
            'id' : id,
            'name' : pool['name'],
            'devices' : devices
        }
        for device_id in pool['devices']:
            try:
                devices.append(self.getDeviceDetail(device_id))
                devices_checked.append(device_id)
            except: pass
        if len(pool['devices']) != len(devices): self.editPool(id, devices=devices)
        return result
    
    def getPoolTable(self):
        return {
            'data' : [{
                'name' : '''<span class="clickable" onclick="showPool('%s');">%s</span>''' % (pool['id'], pool['name']),
                'check' : '''<input class="pool-delete-selected" type="checkbox" pool_id="%s">''' % (pool['id']),
                'devices' : str(len(pool['devices']))
                } for pool in self._pools.values()]}
        
    def addPool(self, devices, name=None):
        if not isinstance(devices, list): devices = [devices]
        devices_checked = []
        for device_id in devices:
            if device_id in self._devices: devices_checked.append(device_id)
        id = str(uuid.uuid4())
        if not name: name = id
        pool = {
            'id' : id,
            'name' : name,
            'devices' : devices_checked,
        }
        self.lock()
        self._pools[id] = pool
        self.writePools()
        self.unlock()
        return pool
    
    def editPool(self, id, devices=None, name=None):
        if id not in self._pools: raise Exception('%s is not in pools' % id)
        self.lock()
        pool = self._pools[id]
        if devices != None:
            if not isinstance(devices, list): devices = [devices]
            devices_checked = []
            for device_id in devices:
                if device_id in self._devices: devices_checked.append(device_id)
            pool['devices'] = devices_checked
        if name: pool['name'] = name
        self.writePools()
        self.unlock()
        return pool
    
    def delPool(self, id):
        if id not in self._pools: raise Exception('%s is not in pools' % id)
        self.lock()
        pool = self._pools.pop(id)
        self.writePools()
        self.unlock()
        return pool
    
    def delPools(self, id):
        if isinstance(id, str): id = [id]
        self.lock()
        for i in id:
            if i in self._pools: self._pools.pop(i)
        self.writePools()
        self.unlock()
        return id
    
    #===========================================================================
    # Command
    #===========================================================================
    def getCommands(self):
        return [{'id' : command['id'], 'name' : command['name']} for command in self._commands.values()]
    
    def getCommandDetail(self, id):
        if id not in self._commands: raise Exception('%s is not in commands' % id)
        return self._commands[id]
    
    def getCommandTable(self):
        result = []
        for command in self._commands.values():
            cmd_lines = list(filter(None, command['text'].split('\n')))
            text = cmd_lines[0] if cmd_lines else ''
            text = text[:20] + ' ...' if len(text) > 20 else text
            text = text + ' ###' if len(cmd_lines) > 1 else text
            result.append({
                'name' : '''<span class="clickable" onclick="showCommand('%s');">%s</span>''' % (command['id'], command['name']),
                'check' : '''<input class="command-delete-selected" type="checkbox" command_id="%s">''' % (command['id']),
                'text' : text,
                'vars' : ', '.join(command['vars'])
            })
        return {'data' : result}
    
    def addCommand(self, text, name=None):
        id = str(uuid.uuid4())
        if not name: name = id
        command = {
            'id' : id,
            'name' : name,
            'text' : text,
            'vars' : re.findall('{(?P<vars>\w+)}', text)
        }
        self.lock()
        self._commands[id] = command
        self.writeCommands()
        self.unlock()
        return command
    
    def editCommand(self, id, text=None, name=None):
        if id not in self._commands: raise Exception('%s is not in commands' % id)
        self.lock()
        command = self._commands[id]
        if text:
            command['text'] = text
            command['vars'] = re.findall('{(?P<vars>\w+)}', text)
        if name: command['name'] = name 
        self.writeCommands()
        self.unlock()
        return command
    
    def delCommand(self, id):
        if id not in self._commands: raise Exception('%s is not in commands' % id)
        self.lock()
        command = self._commands.pop(id)
        self.writeCommands()
        self.unlock()
        return command
    
    def delCommands(self, id):
        if isinstance(id, str): id = [id]
        self.lock()
        for i in id:
            if i in self._commands: self._commands.pop(i)
        self.writeCommands()
        self.unlock()
        return id
    
    #===========================================================================
    # WorkFlow
    #===========================================================================
    def getWorkFlows(self):
        return [{'id' : workflow['id'], 'name' : workflow['name']} for workflow in self._workflows.values()]
    
    def getWorkFlowDetail(self, id):
        if id not in self._workflows: raise Exception('%s is not in workflows' % id)
        workflow = self._workflows[id]
        commands = []
        commands_checked = []
        result = {
            'id' : id,
            'name' : workflow['name'],
            'commands' : commands
        }
        for command_id in workflow['commands']:
            try:
                commands.append(self.getCommandDetail(command_id))
                commands_checked.append(command_id)
            except: pass
        if len(commands_checked) != len(workflow['commands']): self.editWorkFlow(id, commands=commands_checked)
        return result
    
    def getWorkFlowTable(self):
        result = []
        for workflow_id in self._workflows:
            workflow = self.getWorkFlowDetail(workflow_id)
            result.append({
                'name' : '''<span class="clickable" onclick="showWorkFlow('%s');">%s</span>''' % (workflow['id'], workflow['name']),
                'check' : '''<input class="workflow-delete-selected" type="checkbox" workflow_id="%s">''' % (workflow['id']),
                'commands' : ', '.join([command['name'] for command in workflow['commands']])
            })
        return {'data' : result}
    
    def addWorkFlow(self, commands, name=None):
        if not isinstance(commands, list): commands = [commands]
        commands_checked = []
        for command_id in commands:
            if command_id in self._commands: commands_checked.append(command_id)
        id = str(uuid.uuid4())
        if not name: name = id
        workflow = {
            'id' : id,
            'name' : name,
            'commands' : commands_checked,
        }
        self.lock()
        self._workflows[id] = workflow
        self.writeWorkFlows()
        self.unlock()
        return workflow
    
    def editWorkFlow(self, id, commands=None, name=None):
        if id not in self._workflows: raise Exception('%s is not in workflows' % id)
        self.lock()
        workflow = self._workflows[id]
        if commands != None:
            if not isinstance(commands, list): commands = [commands]
            commands_checked = []
            for command_id in commands:
                if command_id in self._commands: commands_checked.append(command_id)
            workflow['commands'] = commands_checked
        if name: workflow['name'] = name
        self.writeWorkFlows()
        self.unlock()
        return workflow
    
    def delWorkFlow(self, id):
        if id not in self._workflows: raise Exception('%s is not in workflows' % id)
        self.lock()
        workflow = self._workflows.pop(id)
        self.writeWorkFlows()
        self.unlock()
        return workflow
    
    def delWorkFlows(self, id):
        if isinstance(id, str): id = [id]
        self.lock()
        for i in id:
            if i in self._workflows: self._workflows.pop(i)
        self.writeWorkFlows()
        self.unlock()
        return id
    