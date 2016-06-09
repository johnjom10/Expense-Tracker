import numpy as np
import csv

f = open('data.csv', 'r')
parsed = csv.reader(f)

j=0
print parsed.next()
for i in parsed:
	if(j==1):
		break
	print i
	j+=1
