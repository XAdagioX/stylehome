#!/bin/bash
# Deploy dist to production. Allowed in sudoers for user deploy.
set -e
cp -r /home/deploy/stylehome-wix-clone/dist/* /var/www/stylehomes/
