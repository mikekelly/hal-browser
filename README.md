HAL-browser
===========

An API browser for the hal+json media type

Instructions
============
All you should need to do is copy the files into your webroot.
It is OK to put it in a subdirectory; it does not need to be in the root.

Do not be afraid of the extra JS and CSS. (like Twitter Bootstrap)
HAL-Browser is self-contained and installs what it needs.


TODO
===========
* Handle failed HTTP requests, present something useful to user (see issue #8)
* Make Location and Content-Location headers clickable links
* Provide feedback to user when there are issues with response (missing
self link, wrong media type identifier)
* Give 'self' and 'curies' links special treatment
* Add spin/loader to the location bar
