== Tasks ==

* Service: add, remove, mark as completed
* Activities: TaskView

#QUESTION: how do we integrate these things into command pattern and actions?
#TODO: have to implement general (modal, main, plugged etc.) activities from features first

The task view activity should likely have hooks for other features to plug into. 
-> Indicates we need a dependency setup for feature, so we guarantee that we have e.g. all relevant slots ready? 

Should projects, or categories that can BE anything (e.g. they are just GUIDs) be part of the tasks setup, 
or shall we do other features that organize this?

E.g. :

We want tasks to go into projects. Projects have aspects different than tasks, and separate data it owns. 
