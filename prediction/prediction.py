from sklearn.linear_model import LinearRegression 
from sklearn.ensemble import RandomForestRegressor 
import pandas as pd
import numpy as np

dataFrame = pd.read_csv('data.csv') 
dataMatrix = dataFrame.as_matrix()
X = dataMatrix[:,1:]
Y = dataMatrix[:,0]

RF = RandomForestRegressor()
RF.fit(X,Y)
print(RF.predict([[0,1,2017]]))
