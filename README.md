# Munin JQuery Template

This is and alternative template for Munin the uses JQuery UI and HTML5.
Some of the feature include:
* Drag'n'drop interface
* Per user custom dashboard (with import/export)
* Zoomable graphs
* Collapsable groups
* Quickview option (stored per user, per group)
* Auto-reload
* Read access to current munin config
* And more stuff, I've probably just forgotten right now...

## Installation

In your munin config folder create a backup of the templates folder.
Then copy this templates folder over the existing one.
One the next munin-html run the interface should be available.

To enable read access to the current configuration, the web interface needs to be able to read the db datafile. To enable this you can just create a link in the output directory of munin, e.g.

	ln -s /munin/db/datafile /var/www/datafile


## Running in CGI mode

Munin has the option to be run in CGI mode as well, which allows munin in some cases to generate graphs only when they are accessed. 
Unfortunately this will usually change a number of paths to the resources needed by html files. 
To make things still work you can use rewrite rules in your web server to redirect requests to the proper resources.
An example for nginx can be found in this [thread](https://github.com/mallocator/Munin-JQuery-Template/issues/1#issuecomment-25678388).


## View configuration overrides 

To enable the link that will show you a current configuration you can link the overrides.js in the munin directory into the  directory of the template:

	ln -s /mnt/munin/munin-overrides.js /var/www/munin/overrides.js
