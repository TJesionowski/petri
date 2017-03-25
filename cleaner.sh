#! /bin/bash

echo 'Cleaning...'
if [ "$( ls -a | egrep '~|EX|Ex|#|.out|.swp' ) " != ""  ] 
then rm $(ls -a | egrep '~|EX|Ex|#|.out|.swp')  
else echo 'Already clean!'
fi

