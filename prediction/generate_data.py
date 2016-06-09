import random
import datetime
import time

print "expense,user_id,month,year"
expenses = [100,200,300,400,500,600,700,800,900,1000,1100,1200]

for i in xrange(100):
	exp = expenses[:]
	for y in xrange(2000,2017):
		for m in xrange(1,13):
			row = ""
			row += str(round(random.uniform(expenses[m-1]*((99-i)),expenses[m-1]*(99-i) + 100),2)) + "," + str(i) +  "," + str(m) + "," + str(y) 
			print row
			exp[m-1] +=100