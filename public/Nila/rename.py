from os import listdir, rename
from os.path import isfile, join

path = '/home/hippo/workspace_bluefish/d1mini/public/Nila'
files = [f for f in listdir(path) if isfile(join(path, f))]
imgs = [f for f in files if len(f) > 3 and not f[-3:] == '.py']

def rnm(src, tar):
	try:
		rename(src, tar)
	except:
		print('could not rename "{0}" to "{1}"'.format(src, tar))

for i, img in enumerate(imgs):
	tar = join(path, 'Nila_' + str(i) + '.jpg')
	print(img, tar)
	rnm(img, tar)
