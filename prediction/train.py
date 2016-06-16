from sklearn.linear_model import LinearRegression as LR
from sklearn.cross_validation import train_test_split as tts
from sklearn.externals import joblib as jb
import pandas as pd
import numpy as np

dataFrame = pd.read_csv('data2.csv')
dataMatrix = dataFrame.as_matrix()
X = dataMatrix[:, 2:]
Y = dataMatrix[:, 0]
X_train, X_test, Y_train, Y_test = tts(X, Y, test_size=0.4, random_state=0)
clf = LR()
clf.fit(X_train, Y_train)
data = [[2040]]
print('Predicted Expense : ' + str(clf.predict(data)))
