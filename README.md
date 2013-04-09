HAL-browser
===========

An API browser for the hal+json media type

Instructions
============
All you should need to do is copy the files into your webroot.
It is OK to put it in a subdirectory; it does not need to be in the root.

All the JS and CSS dependencies come included in the vendor directory.

HAL Info
========
The HAL specification can be found at [http://stateless.co/hal_specification.html](http://stateless.co/hal_specification.html).

TODO
===========
* Handle failed HTTP requests, present something useful to user (see issue #8)
* Make Location and Content-Location headers clickable links
* Provide feedback to user when there are issues with response (missing
self link, wrong media type identifier)
* Give 'self' and 'curies' links special treatment
* Add spin/loader to the location bar
