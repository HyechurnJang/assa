# -*- coding: utf-8 -*-
'''
Created on 2018. 10. 29.
@author: Hyechurn Jang, <hyjang@cisco.com>
'''

import os
import re
import json
import requests
import xmltodict
import ipaddress
from pygics import sleep, rest, Burst, Lock, Task, Queue
from engine.asdm import ASDM

from assa_config import ENGINE_HOST, MONITORING_TIMER

class MonManager(Task):
    
    def __init__(self, engine_host, mon_timer):
        Task.__init__(self, tick=mon_timer, debug=True)
        self.engine_host = engine_host
        self.mon_timer = mon_timer
        self.url_hqdev = 'http://%s/api/hqdev' % self.engine_host
        self.url_devices = 'http://%s/api/device' % self.engine_host
        self.url_pools = 'http://%s/api/pool' % self.engine_host
        self.vpn_devices = []
        self.hq_device = {
            'cpu' : 0,
            'mem' : 0, 
            'traffic' : {
                'input_pkts' : 0,
                'input_bytes' : 0,
                'output_pkts' : 0,
                'output_bytes' : 0,
                'drop_pkts' : 0
            },
            'tunnel' : {
                'live' : 0,
                'total' : 0
            }
        }
        self.start()
    
    def getDevStatus(self, id):
        device = requests.get(self.url_devices + '/%s' % id).json()
        headers = {'Content-Type': 'text/xml', 'Authorization': 'Basic ' + device['account']['token']}
        url = 'https://%s:%d/admin/config' % (device['ip'], device['port'])
        data = '''<?xml version="1.0" encoding="ISO-8859-1"?><config-data config-action="merge" errors="continue">
    <cli id="0">show run</cli>
    <cli id="1">show interface outside stats | i 1 minute</cli>
    <cli id="2">show cpu usage | i CPU utilization</cli>
    <cli id="3">show memory | i Used memory</cli>
</config-data>'''
        ret = {
            'show_run' : None,
            'cpu' : 0,
            'mem' : 0, 
            'traffic' : {
                'input_pkts' : 0,
                'input_bytes' : 0,
                'output_pkts' : 0,
                'output_bytes' : 0,
                'drop_pkts' : 0
            }
        }
        try:
            resp = requests.post(url, data=data, headers=headers, verify=False, timeout=2)
            resp_dict = xmltodict.parse(resp.text)['ErrorList']['config-failure']['error-info']
        except Exception as e:
            ret['show_run'] = [str(e)]
            return ret
        ret['show_run'] = list(filter(None, resp_dict[0]['#text'].split('\n')))
        traffic_stats = list(filter(None, resp_dict[1]['#text'].split('\n')))
        cpu_usages = list(filter(None, resp_dict[2]['#text'].split('\n')))
        mem_usages = list(filter(None, resp_dict[3]['#text'].split('\n')))
        kv = re.match('\s*1 minute input rate\s+(?P<pkts>\d+) pkts/sec,\s+(?P<bytes>\d+) bytes/sec', traffic_stats[0])
        ret['traffic']['input_pkts'] = kv.group('pkts')
        ret['traffic']['input_bytes'] = kv.group('bytes')
        kv = re.match('\s*1 minute output rate\s+(?P<pkts>\d+) pkts/sec,\s+(?P<bytes>\d+) bytes/sec', traffic_stats[1])
        ret['traffic']['output_pkts'] = kv.group('pkts')
        ret['traffic']['output_bytes'] = kv.group('bytes')
        kv = re.match('\s*1 minute drop rate,\s+(?P<pkts>\d+) pkts/sec', traffic_stats[2])
        ret['traffic']['drop_pkts'] = kv.group('pkts')
        kv = re.match('CPU utilization for 5 seconds = \d+%; 1 minute: (?P<usage>\d+)%; 5 minutes: \d+%', cpu_usages[0])
        ret['cpu'] = int(kv.group('usage'))
        kv = re.match('Used memory:\s+(?P<bytes>\d+) bytes \((?P<per>\d+)%\)', mem_usages[0])
        ret['mem'] = int(kv.group('per'))
        return ret
        
    def getResource(self):
        hqdev, devices, pools = Burst(
            ).register(requests.get, self.url_hqdev
            ).register(requests.get, self.url_devices
            ).register(requests.get, self.url_pools
            ).do()
        hqdev = hqdev.json()
        devices = devices.json()
        pools = pools.json()
        return hqdev, devices, pools
    
    def getHQStatus(self, hqdev):
        headers = {'Content-Type': 'text/xml', 'Authorization': 'Basic ' + hqdev['account']['token']}
        url = 'https://%s:%d/admin/config' % (hqdev['ip'], hqdev['port'])
        data = '''<?xml version="1.0" encoding="ISO-8859-1"?><config-data config-action="merge" errors="continue">
    <cli id="0">show crypto ipsec sa | grep remote ident</cli>
    <cli id="1">show interface outside stats | i 1 minute</cli>
    <cli id="2">show cpu usage | i CPU utilization</cli>
    <cli id="3">show memory | i Used memory</cli>
</config-data>'''
        resp = requests.post(url, data=data, headers=headers, verify=False, timeout=2)
        resp_dict = xmltodict.parse(resp.text)['ErrorList']['config-failure']['error-info']
        
        remote_idents = list(filter(None, resp_dict[0]['#text'].split('\n')))
        traffic_stats = list(filter(None, resp_dict[1]['#text'].split('\n')))
        cpu_usages = list(filter(None, resp_dict[2]['#text'].split('\n')))
        mem_usages = list(filter(None, resp_dict[3]['#text'].split('\n')))
        
        return {
            'remote_idents' : remote_idents,
            'traffic_stats' : traffic_stats,
            'cpu_usages' : cpu_usages,
            'mem_usages' : mem_usages
        }
    
    def getDevices(self, hqdev, devices):
        hqdev_id = hqdev['id']
        vpn_devices = []
        for device in devices:
            device_id = device['id']
            if device['vpn_net'] and device_id != hqdev_id:
                net = ipaddress.ip_network(device['vpn_net'])
                vpn_devices.append({
                    'id' : device_id,
                    'pool_id' : [],
                    'name' : device['name'],
                    'ipmask' : '%s/%s' % (str(net.network_address), str(net.netmask)),
                    'live' : False
                })
        return vpn_devices
    
    def __run__(self):
        hqdev, devices, pools = self.getResource()
        if not hqdev['id']: return
        hq_status, vpn_devices = Burst().register(self.getHQStatus, hqdev).register(self.getDevices, hqdev, devices).do()
        remote_idents = hq_status['remote_idents']
        traffic_stats = hq_status['traffic_stats']
        cpu_usages = hq_status['cpu_usages']
        mem_usages = hq_status['mem_usages']
        live_count = 0
        for device in vpn_devices:
            ipmask = device['ipmask']
            for remote_ident in remote_idents:
                if re.search(ipmask, remote_ident):
                    device['live'] = True
                    live_count += 1
                    break
            for pool in pools:
                if device['id'] in pool['devices']:
                    device['pool_id'].append(pool['id'])
        self.vpn_devices = vpn_devices
        
        kv = re.match('\s*1 minute input rate\s+(?P<pkts>\d+) pkts/sec,\s+(?P<bytes>\d+) bytes/sec', traffic_stats[0])
        self.hq_device['traffic']['input_pkts'] = kv.group('pkts')
        self.hq_device['traffic']['input_bytes'] = kv.group('bytes')
        kv = re.match('\s*1 minute output rate\s+(?P<pkts>\d+) pkts/sec,\s+(?P<bytes>\d+) bytes/sec', traffic_stats[1])
        self.hq_device['traffic']['output_pkts'] = kv.group('pkts')
        self.hq_device['traffic']['output_bytes'] = kv.group('bytes')
        kv = re.match('\s*1 minute drop rate,\s+(?P<pkts>\d+) pkts/sec', traffic_stats[2])
        self.hq_device['traffic']['drop_pkts'] = kv.group('pkts')
        
        kv = re.match('CPU utilization for 5 seconds = \d+%; 1 minute: (?P<usage>\d+)%; 5 minutes: \d+%', cpu_usages[0])
        self.hq_device['cpu'] = int(kv.group('usage'))
        
        kv = re.match('Used memory:\s+(?P<bytes>\d+) bytes \((?P<per>\d+)%\)', mem_usages[0])
        self.hq_device['mem'] = int(kv.group('per'))
        
        self.hq_device['tunnel']['total'] = len(vpn_devices)
        self.hq_device['tunnel']['live'] = live_count

mm = MonManager(ENGINE_HOST, MONITORING_TIMER)

@rest('GET', '/mon/vpn')
def getVPNStatus(req):
    return mm.vpn_devices

@rest('GET', '/mon/hqdev')
def getHQDevStatus(req):
    return mm.hq_device

@rest('GET', '/mon/device')
def getDevStatus(req, id):
    return mm.getDevStatus(id)
    