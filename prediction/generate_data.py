import random
import datetime
import time

userid = ""

row = ""

expenses = [100,200,300,400,500,600,700,800,900,1000,1100,1200]

for i in xrange(10):
	for y in xrange(1990,2017):
		for m in xrange(1,13):
			row = ""
			row += str(random.uniform(expenses[m-1]*((9-i)),expenses[m-1]*(9-i) + 100)) + "," + str(i) + "," + str(1) + "," + str(m) + "," + str(y) 
			print row