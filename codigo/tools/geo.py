import json, math
from shapely.geometry import shape, box, Polygon, MultiPolygon, LineString, MultiLineString, Point
from shapely.ops import unary_union, split, linemerge
G='/home/claude/scratch/geo/'
def load(f): return json.load(open(G+f+'.geojson'))['features']

# ---------------- ESPAÑA ----------------
LON0,LON1,LAT0,LAT1=-11.2,5.0,35.0,44.9
def merc(lat): return math.log(math.tan(math.pi/4+math.radians(lat)/2))
SX=1000/math.radians(LON1-LON0)
Y1=merc(LAT1)
def pes(lon,lat): return (round((math.radians(lon-LON0))*SX,1), round((Y1-merc(lat))*SX,1))
H_ES=pes(LON1,LAT0)[1]
print('ES frame 1000 x',H_ES)
# Canarias inset: own frame
CLON0,CLON1,CLAT0,CLAT1=-18.3,-13.3,27.55,29.5
CS=None
def pca(lon,lat):
    sx=1000/math.radians(CLON1-CLON0)
    return (round(math.radians(lon-CLON0)*sx,1), round((merc(CLAT1)-merc(lat))*sx,1))
H_CA=pca(CLON1,CLAT0)[1]

def rings(geom, proj, tol):
    out=[]
    geoms = geom.geoms if hasattr(geom,'geoms') else [geom]
    for g in geoms:
        if g.is_empty: continue
        if g.geom_type=='Polygon':
            g=g.simplify(tol)
            if g.is_empty or g.area< tol*tol*4: continue
            pts=[proj(x,y) for x,y in list(g.exterior.coords)[:-1]]
            out.append(flat(pts))
        elif g.geom_type=='MultiPolygon':
            out+=rings(g,proj,tol)
    return out
def flat(pts):
    r=[]
    for x,y in pts: r+= [round(x), round(y)] if False else [round(x,1), round(y,1)]
    return r
def lines(geom, proj, tol):
    out=[]
    geoms = geom.geoms if hasattr(geom,'geoms') else [geom]
    for g in geoms:
        if g.geom_type=='LineString':
            g=g.simplify(tol); out.append(flat([proj(x,y) for x,y in g.coords]))
        elif g.geom_type in ('MultiLineString','GeometryCollection'):
            out+=lines(g,proj,tol)
    return out

cty=load('ne_10m_admin_0_countries')
bbES=box(LON0,LAT0,LON1,LAT1)
spain=[shape(f['geometry']) for f in cty if f['properties']['ADMIN']=='Spain'][0]
others=unary_union([shape(f['geometry']).intersection(bbES) for f in cty if f['properties']['ADMIN']!='Spain' and shape(f['geometry']).intersects(bbES)])
portugal=[shape(f['geometry']) for f in cty if f['properties']['ADMIN']=='Portugal'][0].intersection(bbES)
rest=others.difference(portugal)
spain_main=spain.intersection(bbES)
canar=spain.intersection(box(CLON0,CLAT0,CLON1,CLAT1))
es={}
es['spain']=rings(spain_main,pes,0.012)
es['portugal']=rings(portugal,pes,0.012)
es['other']=rings(rest,pes,0.02)
es['canarias']=rings(canar,pca,0.008)
es['H']=H_ES; es['HC']=H_CA

# rivers
riv=load('ne_10m_rivers_lake_centerlines')+load('ne_10m_rivers_europe')
names={'Duero':['Duero'],'Tajo':['Tajo','Tejo'],'Guadiana':['Guadiana'],'Guadalquivir':['Guadalquivir'],'Ebro':['Ebro'],
 'Miño':['Minho','Mio','Miño'],'Júcar':['Júcar'],'Segura':['Segura'],'Sil':['Sil'],'Pisuerga':['Pisuerga'],'Esla':['Esla'],
 'Tormes':['Tormes'],'Alberche':['Alberche'],'Tiétar':['Tiétar'],'Genil':['Genil'],'Cinca':['Cinca'],'Segre':['Segre'],
 'Jalón':['Jalón'],'Cabriel':['Cabriel'],'Narcea':['Narcea'],'Henares':['Henares'],'Turia':['Turia']}
bbI=box(-10,35.5,4.5,44.2)
R={}
for key,nl in names.items():
    gs=[]
    for f in riv:
        p=f['properties']; n=p.get('name') or ''
        if n in nl:
            g=shape(f['geometry'])
            if g.intersects(bbI): gs.append(g.intersection(bbI))
    if not gs: print('MISSING',key); continue
    u=unary_union(gs)
    m=linemerge(u) if u.geom_type=='MultiLineString' else u
    R[key]=m
# hand-drawn rivers (lat,lon)
HAND={
'Jarama':[(41.12,-3.50),(40.95,-3.47),(40.75,-3.52),(40.55,-3.55),(40.38,-3.55),(40.20,-3.58),(40.03,-3.62)],
'Eresma':[(40.83,-4.02),(40.95,-4.12),(41.10,-4.35),(41.25,-4.55),(41.42,-4.78),(41.52,-4.88)],
'Cigüela':[(40.10,-2.55),(39.85,-2.80),(39.60,-3.15),(39.35,-3.45),(39.15,-3.70)],
'Jabalón':[(38.72,-2.85),(38.80,-3.30),(38.88,-3.70),(38.98,-4.05)],
'Aragón':[(42.78,-0.52),(42.57,-0.55),(42.62,-1.00),(42.58,-1.30),(42.40,-1.60),(42.24,-1.78)],
'Mundo':[(38.50,-2.42),(38.52,-2.10),(38.45,-1.80),(38.36,-1.60)],
'Guadalentín':[(37.62,-2.20),(37.67,-1.70),(37.78,-1.50),(37.90,-1.30),(37.98,-1.13)],
'Nalón':[(43.10,-5.42),(43.25,-5.70),(43.37,-5.95),(43.55,-6.08)],
'Navia':[(42.80,-7.10),(43.05,-6.95),(43.30,-6.85),(43.54,-6.72)],
'Eo':[(43.15,-7.33),(43.30,-7.15),(43.53,-7.03)],
'Nervión':[(42.95,-2.95),(43.10,-2.90),(43.26,-2.93),(43.35,-3.03)],
'Bidasoa':[(43.10,-1.53),(43.25,-1.65),(43.37,-1.79)],
}
for k,v in HAND.items(): R[k]=LineString([(lo,la) for la,lo in v])
MOUTH={'Duero':(41.14,-8.67),'Tajo':(38.7,-9.3),'Guadiana':(37.17,-7.4),'Guadalquivir':(36.78,-6.36),'Ebro':(40.72,0.87),'Miño':(41.87,-8.87),'Júcar':(39.15,-0.24),'Segura':(38.1,-0.64),'Sil':(42.4,-7.9),'Pisuerga':(41.55,-4.95),'Esla':(41.55,-6.0),'Tormes':(41.3,-6.5),'Alberche':(39.95,-4.7),'Tiétar':(39.83,-5.95),'Genil':(37.72,-5.3),'Cinca':(41.45,0.3),'Segre':(41.38,0.35),'Jalón':(41.75,-1.2),'Cabriel':(39.25,-1.15),'Narcea':(43.42,-6.1),'Henares':(40.4,-3.5),'Turia':(39.45,-0.32)}
def chain(g,mouth):
    segs=[list(l.coords) for l in (g.geoms if hasattr(g,'geoms') else [g]) if l.geom_type=='LineString']
    if not mouth: return LineString(segs[0])
    mx,my=mouth[1],mouth[0]
    d=lambda p:(p[0]-mx)**2+(p[1]-my)**2
    # start: segment endpoint farthest from mouth
    best=None
    for i,s in enumerate(segs):
        for e in (0,-1):
            if best is None or d(s[e])>best[0]: best=(d(s[e]),i,e)
    _,i,e=best; cur=segs.pop(i)
    if e==-1: cur=cur[::-1]
    while segs:
        tail=cur[-1]; bi=None
        for j,s in enumerate(segs):
            for e in (0,-1):
                dd=(s[e][0]-tail[0])**2+(s[e][1]-tail[1])**2
                if bi is None or dd<bi[0]: bi=(dd,j,e)
        dd,j,e=bi
        if dd>0.5**2: break
        s=segs.pop(j); cur+= (s if e==0 else s[::-1])
    if d(cur[0])<d(cur[-1]): cur=cur[::-1]
    return LineString(cur)
es['rivers']={}
for k,g in R.items():
    if k in MOUTH: g=chain(g,MOUTH[k])
    L=lines(g,pes,0.006)
    # orient each river so first point is source: choose the endpoint farther from sea? store raw; fix direction later in JS by 'mouth' flag
    es['rivers'][k]=L
    print(k, len(L), sum(len(l)//2 for l in L))

def pl(latlon): return flat([pes(lo,la) for la,lo in latlon])
RANGES={
'cantabrica':[(42.95,-6.85),(43.02,-6.2),(43.05,-5.6),(43.05,-5.0),(43.1,-4.5),(43.05,-4.0),(43.0,-3.55)],
'leon':[(42.85,-6.15),(42.6,-6.35),(42.35,-6.6),(42.1,-6.85)],
'galaico':[(43.25,-7.95),(42.85,-7.7),(42.45,-7.55),(42.05,-7.75)],
'vascos':[(43.05,-3.3),(43.0,-2.75),(43.03,-2.2),(43.1,-1.8)],
'pirineos':[(43.1,-1.55),(42.85,-0.8),(42.72,0.0),(42.65,0.8),(42.5,1.6),(42.45,2.4),(42.42,3.0)],
'catalana':[(40.85,0.5),(41.15,0.95),(41.45,1.65),(41.7,2.3),(41.95,2.8)],
'iberico':[(42.3,-3.2),(42.0,-2.7),(41.8,-2.1),(41.55,-1.75),(41.15,-1.6),(40.75,-1.6),(40.4,-1.45),(40.12,-1.05),(39.95,-0.6)],
'central':[(40.25,-6.85),(40.35,-6.3),(40.28,-5.65),(40.25,-5.1),(40.5,-4.6),(40.8,-4.05),(41.05,-3.6),(41.25,-3.2)],
'toledo':[(39.5,-5.4),(39.45,-4.85),(39.5,-4.3),(39.55,-3.85)],
'morena':[(38.0,-7.0),(38.1,-6.3),(38.2,-5.6),(38.3,-4.8),(38.35,-4.0),(38.4,-3.3),(38.45,-2.7)],
'penibetico':[(36.5,-5.3),(36.75,-4.6),(37.0,-3.7),(37.08,-3.1),(37.15,-2.5),(37.2,-2.0)],
'subbetico':[(37.05,-5.0),(37.4,-4.3),(37.6,-3.6),(37.9,-2.75),(38.1,-2.2),(38.3,-1.4),(38.6,-0.6)],
'tramontana':[(39.55,2.38),(39.72,2.62),(39.84,2.85),(39.93,3.08)],
}
es['ranges']={k:pl(v) for k,v in RANGES.items()}
POLY={
'ebro':[(42.55,-2.3),(42.4,-1.4),(42.2,-0.4),(42.0,0.35),(41.75,0.85),(41.35,0.65),(41.15,0.25),(41.25,-0.55),(41.5,-1.25),(41.9,-1.9),(42.25,-2.5)],
'guadalquivir':[(38.15,-3.0),(38.0,-4.0),(37.85,-5.0),(37.65,-5.9),(37.35,-6.5),(36.95,-6.35),(37.05,-5.6),(37.3,-4.8),(37.55,-3.9),(37.85,-3.15)],
}
es['depr']={k:pl(v) for k,v in POLY.items()}
meseta=Polygon([(lo,la) for la,lo in [(42.8,-6.05),(42.88,-5.2),(42.9,-4.4),(42.85,-3.6),(42.35,-3.35),(41.95,-2.75),(41.55,-2.05),(41.05,-2.0),(40.55,-2.05),(40.0,-1.85),(39.45,-1.75),(38.95,-2.1),(38.6,-2.6),(38.5,-3.3),(38.45,-4.1),(38.35,-4.9),(38.25,-5.7),(38.2,-6.5),(38.4,-7.1),(39.3,-7.35),(40.0,-6.95),(40.7,-6.85),(41.2,-6.7),(41.6,-6.35),(42.0,-6.6),(42.4,-6.5)]]).intersection(spain_main)
cut=LineString([(-8,40.35)]+[(lo,la) for la,lo in RANGES['central']]+[(-2.8,41.4),(-1.5,41.6)])
parts=split(meseta,cut)
parts=sorted(parts.geoms,key=lambda g:-g.centroid.y)
es['meseta']=rings(meseta,pes,0.01)
es['subN']=rings(parts[0],pes,0.01)
es['subS']=rings(unary_union(parts[1:]),pes,0.01)
PTS={'finisterre':(42.88,-9.27),'bares':(43.79,-7.69),'penas':(43.66,-5.85),'ajo':(43.51,-3.59),'matxitxako':(43.45,-2.75),
'creus':(42.32,3.32),'palos':(37.63,-0.69),'gata':(36.72,-2.19),'tarifa':(36.01,-5.61),'deltaEbro':(40.72,0.87),
'gVizcaya':(44.05,-3.2),'gValencia':(39.35,-0.05),'gAlmeria':(36.72,-2.5),'gCadiz':(36.55,-6.85),'rias':(42.45,-8.95),'donana':(36.95,-6.35),
'mallorca':(39.62,2.95),'menorca':(39.95,4.1),'ibiza':(38.98,1.43),'madrid':(40.42,-3.70),'ceuta':(35.89,-5.32),'melilla':(35.29,-2.94),
'marCantabrico':(44.25,-5.3),'oAtlantico':(39.3,-10.3),'marMedit':(38.6,2.3),'galicia':(42.75,-7.9),'asturias':(43.3,-6.0),'cantabria':(43.2,-4.0),'paisVasco':(43.05,-2.6),
'valencia':(39.47,-0.38),'sevilla':(37.39,-5.98),'murcia':(37.98,-1.13),'zaragoza':(41.65,-0.88),'barcelona':(41.39,2.17),'bilbao':(43.26,-2.93),'santiago':(42.88,-8.54),
'toledoC':(39.86,-4.02),'salamanca':(40.97,-5.66),'granada':(37.18,-3.6),'malaga':(36.72,-4.42),'almeria':(36.84,-2.46),'cadiz':(36.53,-6.29),'huesca':(42.14,-0.41),'jaca':(42.57,-0.55),'leonC':(42.6,-5.57),'valladolid':(41.65,-4.72),'palma':(39.57,2.65),'oviedo':(43.36,-5.85),'santander':(43.46,-3.8),'teruel':(40.34,-1.1),'badajoz':(38.88,-6.97),'caceres':(39.47,-6.37),'navacerrada':(40.79,-4.01),'sNevada':(37.05,-3.3),'aneto':(42.63,0.66),
}
es['pts']={k:pes(lo,la) for k,(la,lo) in PTS.items()}
CPTS={'teide':(28.27,-16.64),'tenerife':(28.3,-16.55),'granCanaria':(27.95,-15.6),'lanzarote':(29.05,-13.6),'fuerteventura':(28.4,-14.0),'laPalma':(28.7,-17.85),'gomera':(28.1,-17.2),'hierro':(27.75,-18.0)}
es['cpts']={k:pca(lo,la) for k,(la,lo) in CPTS.items()}

# ---------------- EUROPA ----------------
lam0,phi0=math.radians(20),math.radians(53)
def laea(lon,lat):
    l=math.radians(lon); p=math.radians(lat)
    k=math.sqrt(2/(1+math.sin(phi0)*math.sin(p)+math.cos(phi0)*math.cos(p)*math.cos(l-lam0)))
    x=k*math.cos(p)*math.sin(l-lam0); y=k*(math.cos(phi0)*math.sin(p)-math.sin(phi0)*math.cos(p)*math.cos(l-lam0))
    return x,-y
c50=load('ne_50m_admin_0_countries')
bbEU=box(-45,18,100,85)
mask=Polygon([(-40,20),(-40,80),(66.2,80),(66.2,68.5),(64.8,67.5),(60.0,64.5),(59.3,61.5),(59.0,58.0),(59.3,55.0),(58.6,51.8),(55,50.5),(51.5,47.0),(49.5,45.0),(49.0,41.5),(45.5,42.2),(42.0,43.3),(40.0,43.4),(37.5,44.8),(36.5,45.2),(30,20)])
eur=[]; oth=[]
for f in c50:
    g=shape(f['geometry'])
    if not g.intersects(bbEU): continue
    g=g.intersection(bbEU)
    cont=f['properties']['CONTINENT']; n=f['properties']['NAME']
    if cont=='Europe' or n in ('Cyprus','N. Cyprus'):
        eur.append(g.intersection(mask)); oth.append(g.difference(mask))
    else: oth.append(g)
eurU=unary_union(eur); othU=unary_union(oth).difference(eurU)
# project
allx=[];ally=[]
for g in (eurU,othU):
    for gg in (g.geoms if hasattr(g,'geoms') else [g]):
        for x,y in gg.exterior.coords:
            X,Y=laea(x,y); allx.append(X); ally.append(Y)
# frame: fit a lon/lat window
fx0,fx1=min(allx),max(allx); fy0,fy1=min(ally),max(ally)
# crop to window around Europe
cx0=min(laea(-25,64)[0],laea(-11.5,37)[0]); cy0=min(laea(25,72.3)[1],laea(66,69.5)[1])
cx1=laea(66,58)[0]; cy1=laea(20,33.8)[1]
S=1000/(cx1-cx0)
def peu(lon,lat):
    X,Y=laea(lon,lat); return (round((X-cx0)*S,1), round((Y-cy0)*S,1))
H_EU=(cy1-cy0)*S
print('EU frame 1000 x',H_EU)
from shapely.ops import transform
from shapely.ops import transform as shp_tf
FR=None
def eurings(g,tol):
    g=g.simplify(tol)
    pg=shp_tf(lambda x,y,z=None:(tuple(peu(a,b)[0] for a,b in zip(x,y)),tuple(peu(a,b)[1] for a,b in zip(x,y))) if hasattr(x,'__len__') else peu(x,y), g)
    pg=pg.buffer(0).intersection(box(-30,-30,1030,H_EU+30))
    return rings(pg,lambda x,y:(x,y),0.4)
eu={'H':H_EU,'europe':eurings(eurU,0.05),'other':eurings(othU,0.08)}
lk=[shape(f['geometry']) for f in load('ne_50m_lakes') if shape(f['geometry']).intersects(bbEU) and shape(f['geometry']).area>0.3]
eu['lakes']=eurings(unary_union(lk),0.05)
ER={'Rin':['Rhine','Rhin','Rhein'],'Elba':['Elbe'],'Danubio':['Danube','Donau'],'Volga':['Volga'],'Ródano':['Rhône'],'Po':['Po']}
eu['rivers']={}
rv=load('ne_10m_rivers_lake_centerlines')
for k,nl in ER.items():
    gs=[shape(f['geometry']) for f in rv if (f['properties'].get('name') in nl) and shape(f['geometry']).intersects(bbEU)]
    u=unary_union(gs)
    m=linemerge(u) if u.geom_type=='MultiLineString' else u
    eu['rivers'][k]=lines(m,peu,0.03)
ERANGE={
'pirineos':[(43.2,-1.7),(42.8,-0.4),(42.6,1.0),(42.45,2.6)],
'alpes':[(44.1,7.4),(45.0,6.9),(45.9,7.2),(46.4,8.6),(46.8,10.3),(47.1,12.0),(47.3,13.8),(47.6,15.6)],
'apeninos':[(44.3,8.7),(44.2,10.5),(43.4,12.4),(42.3,13.6),(41.2,15.0),(40.2,15.9),(39.2,16.2),(38.4,16.0)],
'carpatos':[(48.3,17.6),(49.2,19.4),(49.3,21.8),(48.6,23.6),(47.6,25.0),(46.6,25.7),(45.6,25.6),(45.4,24.2),(45.3,22.7)],
'caucaso':[(44.7,38.2),(43.8,41.0),(43.2,43.5),(42.4,45.8),(41.3,48.6)],
'urales':[(51.9,58.6),(54.2,58.9),(56.8,59.2),(59.5,59.1),(62.0,59.4),(64.5,59.9),(66.5,63.2),(67.8,65.8)],
'escandinavos':[(58.9,6.6),(60.5,7.8),(62.0,9.5),(63.5,12.3),(65.3,14.4),(67.0,16.3),(68.5,18.5),(69.6,21.5)],
}
eu['ranges']={k:flat([peu(lo,la) for la,lo in v]) for k,v in ERANGE.items()}
EPTS={
'granLlanura':(52.5,12.5),'llanuraOriental':(54.5,38.0),'pEscandinava':(63.5,16.0),'jutlandia':(56.2,9.1),'pIberica':(40.0,-4.0),'pItalica':(42.3,13.0),'pBalcanica':(42.2,22.5),
'islandia':(64.9,-18.6),'britanicas':(53.8,-2.5),'corcega':(42.15,9.05),'cerdena':(40.1,9.0),'sicilia':(37.55,14.2),'creta':(35.25,24.9),'chipre':(35.0,33.1),
'gFinlandia':(59.8,25.0),'gVizcaya':(45.3,-3.8),'gLeon':(43.0,4.2),'gGenova':(44.1,9.0),
'oArtico':(71.3,30.0),'oAtlantico':(50.0,-18.0),'marMedit':(35.9,17.5),'mNorte':(56.3,3.0),'mBaltico':(57.5,19.5),'mNegro':(43.3,34.0),'mCaspio':(42.5,50.8),
'madrid':(40.42,-3.7),'paris':(48.86,2.35),'roma':(41.9,12.5),'berlin':(52.52,13.4),'londres':(51.5,-0.12),'moscu':(55.75,37.6),'atenas':(37.98,23.73),'oslo':(59.9,10.75),'estocolmo':(59.33,18.06),'viena':(48.2,16.37),'reikiavik':(64.14,-21.9),'helsinki':(60.17,24.94),'varsovia':(52.23,21.0),
}
eu['pts']={k:peu(lo,la) for k,(la,lo) in EPTS.items()}
# climate zones of Europe (approximate, lat/lon polygons) -> clipped to Europe land
CZ={
'polar':[(62,-30),(62,-10),(66.2,-10),(66.2,12),(66,30),(64.5,45),(64,70),(80,70),(80,-30)],
'mediterraneo':[(34,-12),(43.2,-9.5),(42.5,-6.5),(42.2,-2),(42.2,1.5),(43.8,4),(44.2,8.5),(45.5,12.5),(45.0,14),(43.5,18.5),(42.5,21.5),(41.5,24.5),(41.3,29),(40.5,34),(34,36)],
'continental':[(66,14.5),(63.5,12.3),(61,12.3),(59,11.6),(57.5,12.1),(55.5,13.2),(54.3,14.8),(52,15.5),(50.5,14.5),(49,13.5),(48,14.5),(47.3,16.0),(46.6,14.6),(45.6,13.9),(44.2,15.0),(42.0,18.0),(40.0,20.0),(37.5,22.5),(36.0,26.0),(36.0,40.0),(40,70),(64,70),(64.5,45),(66,30)],
}
cz={}
landEU=eurU
for k,v in CZ.items():
    p=Polygon([(lo,la) for la,lo in v]).buffer(0)
    cz[k]=p.intersection(landEU)
montEU=unary_union([LineString([(lo,la) for la,lo in ERANGE[k]]).buffer(w) for k,w in (('alpes',0.9),('pirineos',0.45),('carpatos',0.7),('caucaso',0.9),('apeninos',0.35),('escandinavos',0.8))]).intersection(landEU)
for k in list(cz): cz[k]=cz[k].difference(montEU)
oceanico=landEU.difference(unary_union(list(cz.values())+[montEU]))
cz['montana']=montEU
cz['oceanico']=oceanico
eu['clima']={k:eurings(v,0.08) for k,v in cz.items()}
es['clima']={}
# Spain climates
CES={
'oceanico':[(44.5,-10),(42.0,-10),(42.0,-8.8),(42.3,-7.2),(42.7,-6.4),(42.85,-4.8),(42.75,-3.6),(42.8,-2.6),(42.85,-1.6),(43.2,-1.2),(44.5,-1.2)],
}
oc=Polygon([(lo,la) for la,lo in CES['oceanico']]).intersection(spain_main)
mont=unary_union([LineString([(lo,la) for la,lo in RANGES[k]]).buffer(0.22 if k in ('pirineos',) else 0.16) for k in ('pirineos','cantabrica','central','iberico','penibetico')]).intersection(spain_main)
es['clima']['oceanico']=rings(oc.difference(mont),pes,0.01)
es['clima']['montana']=rings(mont,pes,0.01)
json.dump({'es':es,'eu':eu},open('/home/claude/game/src/geo.json','w'),separators=(',',':'),ensure_ascii=False)
import os; print('bytes',os.path.getsize('/home/claude/game/src/geo.json'))
