# -*- coding: utf-8 -*-
'''
Created on 2018. 10. 29.
@author: Hyechurn Jang, <hyjang@cisco.com>
'''

import base64
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import xmltodict

class ASDM:
    
    def __init__(self, ip, port, dp_ip, account, **kargs):
        self.ip = ip
        self.port = port
        self.dp_ip = dp_ip
        self.username = account['username']
        self.password = account['password']
        self.token = account['token']
        if self.token:
            self.b64_credentials = self.token
        elif self.username and self.password:
            self.b64_credentials = base64.b64encode((self.username + ':' + self.password).encode()).decode()
        else:
            raise Exception('incorrect account credential')
        self.headers = {
            'Content-Type': 'text/xml',
            'Authorization': 'Basic ' + self.b64_credentials
        }
        
        self.asdm_endpoint = 'https://%s:%d/admin/config' % (ip, port)
        self.asdm_cfg_tmpl = '<?xml version="1.0" encoding="ISO-8859-1"?><config-data config-action="merge" errors="continue">%s</config-data>'
        self.asdm_cmd_tmpl = '<cli id="%d">%s</cli>'
        
    def cli(self, command_text):
        cmd_lines = list(filter(None, command_text.replace('#NODE#', self.dp_ip).split('\n')))
        cmd_str = ''
        count = 0
        for cmd in cmd_lines:
            cmd_str += self.asdm_cmd_tmpl % (count, cmd)
            count += 1
        cmd_str = self.asdm_cfg_tmpl % cmd_str
        try: resp = requests.post(self.asdm_endpoint, data=cmd_str, headers=self.headers, verify=False, timeout=2)
        except Exception as e: return e
        if resp.status_code != 200: return Exception('[ERROR] Inccorect HTTP Response Status with %d' % resp.status_code)
        try:
            resp_dict = xmltodict.parse(resp.text)['ErrorList']['config-failure']['error-info']
            result = []
            if count == 1: result.append(list(filter(None, resp_dict['#text'].split('\n'))))
            else:
                for i in range(0, count):
                    result.append(list(filter(None, resp_dict[i]['#text'].split('\n'))))
            return result
        except Exception as e:
            return e
    
