# -*- coding: utf-8 -*-
'''
Created on 2018. 10. 30.
@author: Hyechurn Jang, <hyjang@cisco.com>
'''

import json
from pygics import *

def file(url):
    
    def wrapper(logic):
        
        def exporter(req, res):
            try:
                # Run API Processing
                data = logic(req, *req.args, **req.kargs)
                # Deciding Content Type
                fd = data
                content_type = req.content_type if req.content_type else ContentType.getType(fd.name)
                data = fd.read()
                fd.close()
            # Exception Processing
            except Response.__HTTP__ as e:
                res(e.status, e.headers)
                return e.data
            except TypeError as e:
                ENV.LOG.exception(str(e))
                res('400 Bad Request', [('Content-Type', ContentType.AppJson)])
                return json.dumps({'error' : str(e)})
            except Exception as e:
                ENV.LOG.exception(str(e))
                res('500 Internal Server Error', [('Content-Type', ContentType.AppJson)])
                return json.dumps({'error' : str(e)})
            # Build Response
            headers = [('Content-Type', content_type)]
            if req.cookies_new:
                for k, v in req.cookies_new.items(): headers.append(('Set-Cookie', '%s=%s' % (k, v)))
            res('200 OK', headers)
            return data
        
        ENV.URI.register(logic, exporter, 'GET', url, None)
        return exporter
     
    return wrapper