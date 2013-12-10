HAL-browser
===========
An API browser for the hal+json media type

Example Usage
=============
Here is an example of a hal+json API using the browser:

[http://haltalk.herokuapp.com/explorer/browser.html](http://haltalk.herokuapp.com/explorer/browser.html)

About HAL
========
HAL is a format based on json that establishes conventions for
representing links. For example:

```javascript
{
    "_links": {
        "self": { "href": "/orders" },
        "next": { "href": "/orders?page=2" }
    }
}
```

More detail about HAL can be found at
[http://stateless.co/hal_specification.html](http://stateless.co/hal_specification.html).

Dependencies
============
As per the bower.json, you will need:
* Bootstrap 3.0
* Backbone 1.1
* url-template 2.0

Instructions
============
TBD

TODO
===========
* Make Location and Content-Location headers clickable links
* Provide feedback to user when there are issues with response (missing
self link, wrong media type identifier)
* Give 'self' and 'curies' links special treatment
