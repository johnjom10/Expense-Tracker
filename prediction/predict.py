from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.cross_validation import train_test_split as tts
from sklearn.externals import joblib as jb
import pandas as pd
import numpy as np

data = [[12, 2048]]
RF = jb.load('pickles/expenseTrained.pkl')
print('Predicted Expense : ' + str(RF.predict(data)))
