import png, array, glob

class ImageList:
    def __init__(self, name):
        self.name = name;
        self.data = []
        self.command = "makeImage"
        if "big" in self.name:
            self.command = "makeImage"

    def add_image(self, data):
        self.data.append(data)

    def write(self, filehandle):
        print("dumping sprite: "+self.name)
        if len(self.data) == 1:
            filehandle.write("var "+self.name+"Sprite : HTMLCanvasElement = "+self.command+"(\""+self.data[0]+"\")\n")
        else:
            filehandle.write("var "+self.name+"Sprites : HTMLCanvasElement[] = [\n\t"+self.command+"(\""+self.data[0]+"\"),\n")
            for dat in self.data[1:-1]:
                filehandle.write("\t"+self.command+"(\""+dat+"\"),\n")
            filehandle.write("\t"+self.command+"(\""+self.data[-1]+"\")]\n")

images={}

def read_file(f):
    fname=f.split("\\")[1].split(".")[0]
    name = fname.split('-')[0]
    reader = png.Reader(f)
    w, h, pixels, metadata = reader.read_flat()
    pixel_byte_width = 4 if metadata['alpha'] else 3
    out = ""
    for i in range(h):
        for j in range(w):
            position = i * w + j
            out += (hex(pixels[position*pixel_byte_width])[2])
    if not name in images:
        images[name] = ImageList(name)
    images[name].add_image(out)

file = open("../typescript/sprites.ts",'w')
file.write("/// <reference path=\"config.ts\" />\n")
for f in glob.glob("../art-src/*.png"):
    read_file(f)

for image in images.values():
    image.write(file)