# -*- coding: utf-8 -*-
'''
Created on 2018. 10. 29.
@author: Hyechurn Jang, <hyjang@cisco.com>
'''

from pygics import export, rest
from .resources import ResourceManager
from .webfile import file

rm = ResourceManager()

@file('/')
def getFile(req, *path):
    if not path: return open('web/index.html', 'rb')
    else: return open('web/%s' % '/'.join(path), 'rb')

@rest('GET', '/api/account')
def getAccount(req, id=None):
    if id: return rm.getAccountDetail(id)
    else: return rm.getAccounts()

@rest('GET', '/api/datatable/account')
def getAccountTable(req, *args, **kargs):
    return rm.getAccountTable()

@rest('POST', '/api/account')
def addAccount(req): return rm.addAccount(**req.data)

@rest('PUT', '/api/account')
def editAccount(req, id): return rm.editAccount(id, **req.data)

@rest('DELETE', '/api/account')
def delAccount(req, id): return rm.delAccount(id)

@rest('POST', '/api/delete/accounts')
def delAccounts(req): return rm.delAccounts(**req.data)

@rest('GET', '/api/hqdev')
def getHQDevice(req): return rm.getHQDevice()

@rest('GET', '/api/device')
def getDevice(req, id=None):
    if id: return rm.getDeviceDetail(id)
    else: return rm.getDevices()

@rest('GET', '/api/datatable/device')
def getDeviceTable(req, *args, **kargs):
    return rm.getDeviceTable()

@rest('GET', '/api/monitor/device')
def getDeviceMonitor(req):
    return rm.getDeviceMonitor()

@rest('POST', '/api/device')
def addDevice(req): return rm.addDevice(**req.data)

@rest('PUT', '/api/device')
def editDevice(req, id): return rm.editDevice(id, **req.data)

@rest('DELETE', '/api/device')
def delDevice(req, id): return rm.delDevice(id)

@rest('POST', '/api/delete/devices')
def delDevices(req): return rm.delDevices(**req.data)

@rest('GET', '/api/pool')
def getPool(req, id=None):
    if id: return rm.getPoolDetail(id)
    else: return rm.getPools()

@rest('GET', '/api/datatable/pool')
def getPoolTable(req, *args, **kargs):
    return rm.getPoolTable()

@rest('POST', '/api/pool')
def addPool(req): return rm.addPool(**req.data)

@rest('PUT', '/api/pool')
def editPool(req, id): return rm.editPool(id, **req.data)

@rest('DELETE', '/api/pool')
def delPool(req, id): return rm.delPool(id)

@rest('POST', '/api/delete/pools')
def delPools(req): return rm.delPools(**req.data)

@rest('GET', '/api/command')
def getCommand(req, id=None):
    if id: return rm.getCommandDetail(id)
    else: return rm.getCommands()

@rest('GET', '/api/datatable/command')
def getCommandTable(req, *args, **kargs):
    return rm.getCommandTable()

@rest('POST', '/api/command')
def addCommand(req): return rm.addCommand(**req.data)

@rest('PUT', '/api/command')
def editCommand(req, id): return rm.editCommand(id, **req.data)

@rest('DELETE', '/api/command')
def delCommand(req, id): return rm.delCommand(id)

@rest('POST', '/api/delete/commands')
def delCommands(req): return rm.delCommands(**req.data)

@rest('GET', '/api/workflow')
def getWorkFlow(req, id=None):
    if id: return rm.getWorkFlowDetail(id)
    else: return rm.getWorkFlows()

@rest('GET', '/api/datatable/workflow')
def getWorkFlowTable(req, *args, **kargs):
    return rm.getWorkFlowTable()

@rest('POST', '/api/workflow')
def addWorkFlow(req): return rm.addWorkFlow(**req.data)

@rest('PUT', '/api/workflow')
def editWorkFlow(req, id): return rm.editWorkFlow(id, **req.data)

@rest('DELETE', '/api/workflow')
def delWorkFlow(req, id): return rm.delWorkFlow(id)

@rest('POST', '/api/delete/workflows')
def delWorkFlows(req): return rm.delWorkFlows(**req.data)
