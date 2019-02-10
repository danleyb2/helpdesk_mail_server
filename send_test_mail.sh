#!/usr/bin/env bash
swaks --body test_email.html --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html"  -h domain.com -f danleyb2@gmail.com -t support@danleyb2.online -s localhost -p 2525
