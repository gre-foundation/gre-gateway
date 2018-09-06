sudo npm cache clean -f
sudo npm install -g n
sudo n stable
To upgrade to latest version (and not current stable) version, you can use

sudo n latest
To undo:
sudo apt-get install --reinstall nodejs-legacy     # fix /usr/bin/node
sudo n rm 6.0.0     # replace number with version of Node that was installed
sudo npm uninstall -g n