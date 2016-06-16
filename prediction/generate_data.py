import random
import datetime
import time

print "expense,user_id,year"
expenses = [
    [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200], [160, 304, 210, 127, 83, 167, 1080, 680, 450, 122, 250, 415], [100, 304, 300, 830, 500, 167, 700, 680, 900, 122, 1200, 415], [260, 704, 510, 1270, 830, 167, 180, 180, 250, 1220, 2500, 715], [16, 30.4, 21, 127, 83, 16.7, 108, 68, 45, 122, 25, 41.5], [100, 160, 100, 260, 16, 200, 304, 500, 844, 123, 90, 67]]

for i in xrange(1):
    exp = expenses[random.randint(0, 4)]
    m = 12
    for y in xrange(2000, 2020):
        row = ""
        row += str(round(random.uniform(exp[m - 1], exp[m - 1] + 100), 2)) + "," + str(
            i) + "," + str(y)
        print row
