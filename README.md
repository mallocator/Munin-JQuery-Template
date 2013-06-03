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