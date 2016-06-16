from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.cross_validation import train_test_split as tts
from sklearn.externals import joblib as jb
import pandas as pd
import numpy as np

dataFrame = pd.read_csv('data2.csv')
dataMatrix = dataFrame.as_matrix()
X = dataMatrix[:, 2:]
Y = dataMatrix[:, 0]
X_train, X_test, Y_train, Y_test = tts(X, Y, test_size=0.4, random_state=0)
RF = jb.load('pickles/expenseTrained.pkl')
print RF.score(X_test, Y_test)
