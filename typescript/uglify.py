replaceDict = {
    "GameEntity" : "GE",
    "Timer" : "Ti",
    "Sequence" : "Se",
    "Item" : "It",
    "artifacts" : "af",
    "items" : "its",
    "entities" : "ent"
}

f = open("../build/out.js")
line = f.readline()
f.close()

for [k, v] in replaceDict.items():
    line = line.replace(k,v)

f = open("../build/out.js",'w')
f.write(line)
f.close()

