"use client";
import React,{useState,useEffect,useRef,useCallback}from'react';
import{motion,AnimatePresence}from'framer-motion';
import{DollarSign,Shield,Play,Trophy,Clock,MapPin,Zap,Star,Heart,Volume2,VolumeX,RotateCcw,ChevronRight,Sparkles,Target,AlertTriangle,RefreshCw,User,Eye,Swords,TrendingUp,TrendingDown,Cloud,Sun,CloudRain,Wind,BarChart2,Pause,FastForward,ShoppingCart,X,Home,Settings,ShoppingBag,List,Award,Activity,Users,ArrowLeftRight}from'lucide-react';

// ─── INTERFACES ──────────────────────────────────────────────
interface Player{
  id:number;name:string;pos:string;posInd:string;
  rating:number;baseRating:number;// base untuk development tracking
  age:number;// untuk youth development
  price:number;nationality:string;
  starter:boolean;form:number;stamina:number;morale:number;
  yellowCards:number;// accumulative across season
  matchYellows:number;// this match (reset each game)
  redCard:boolean;suspended:boolean;// suspended=true → miss next match
  injured:boolean;injuryWeeks:number;// 0=healthy, >0=weeks remaining
  unhappy:number;goals:number;assists:number;matchesPlayed:number;club?:string;
}
interface Opponent{
  name:string;ovr:number;atk:number;mid:number;def:number;
  stadium:string;isAway:boolean;formation:string;
  scorers:string[];color:string;dangerPlayers:string[];
  recentForm:string[];isDerby:boolean;
  strengths:string[];weaknesses:string[];tacticalTip:string;
  squad?:{name:string;pos:string;rating:number}[];
}
interface MatchLog{
  text:string;minute:number;
  type:'info'|'goal-p'|'goal-o'|'chance'|'halftime'|'fulltime'|'sub'|'card'|'red'|'injury'|'decision';
}
interface Standing{name:string;played:number;won:number;draw:number;lost:number;gf:number;ga:number;points:number;color:string;}
// In-match decision moment
interface MatchDecision{
  minute:number;
  situation:string;
  options:{label:string;emoji:string;effect:'goal'|'miss'|'card'|'injury_risk'|'morale_boost'|'nothing'}[];
}

// ─── FORMATIONS ──────────────────────────────────────────────
const FORMATIONS={
  '4-4-2':{name:'4-4-2',desc:'Klasik seimbang',pos:{GK:1,DF:4,MF:4,FW:2},bonus:{atk:0,def:0,mid:0},strong:['3-5-2'],weak:['4-3-3'],
    layout:[{p:'GK',x:50,y:85},{p:'DF',x:14,y:67},{p:'DF',x:36,y:72},{p:'DF',x:64,y:72},{p:'DF',x:86,y:67},{p:'MF',x:14,y:46},{p:'MF',x:36,y:50},{p:'MF',x:64,y:50},{p:'MF',x:86,y:46},{p:'FW',x:33,y:22},{p:'FW',x:67,y:22}]},
  '4-3-3':{name:'4-3-3',desc:'Menyerang, winger aktif',pos:{GK:1,DF:4,MF:3,FW:3},bonus:{atk:5,def:-3,mid:0},strong:['4-4-2','5-3-2'],weak:['4-2-3-1'],
    layout:[{p:'GK',x:50,y:85},{p:'DF',x:14,y:67},{p:'DF',x:36,y:72},{p:'DF',x:64,y:72},{p:'DF',x:86,y:67},{p:'MF',x:26,y:49},{p:'MF',x:50,y:43},{p:'MF',x:74,y:49},{p:'FW',x:17,y:19},{p:'FW',x:50,y:13},{p:'FW',x:83,y:19}]},
  '3-5-2':{name:'3-5-2',desc:'Dominasi tengah',pos:{GK:1,DF:3,MF:5,FW:2},bonus:{atk:2,def:-2,mid:5},strong:['4-2-3-1'],weak:['4-4-2','4-3-3'],
    layout:[{p:'GK',x:50,y:85},{p:'DF',x:24,y:70},{p:'DF',x:50,y:65},{p:'DF',x:76,y:70},{p:'MF',x:9,y:48},{p:'MF',x:28,y:43},{p:'MF',x:50,y:48},{p:'MF',x:72,y:43},{p:'MF',x:91,y:48},{p:'FW',x:33,y:22},{p:'FW',x:67,y:22}]},
  '5-3-2':{name:'5-3-2',desc:'Pertahanan solid',pos:{GK:1,DF:5,MF:3,FW:2},bonus:{atk:-3,def:6,mid:0},strong:['4-3-3'],weak:['3-5-2'],
    layout:[{p:'GK',x:50,y:85},{p:'DF',x:9,y:67},{p:'DF',x:28,y:72},{p:'DF',x:50,y:67},{p:'DF',x:72,y:72},{p:'DF',x:91,y:67},{p:'MF',x:26,y:46},{p:'MF',x:50,y:50},{p:'MF',x:74,y:46},{p:'FW',x:33,y:22},{p:'FW',x:67,y:22}]},
  '4-2-3-1':{name:'4-2-3-1',desc:'Taktis modern',pos:{GK:1,DF:4,MF:5,FW:1},bonus:{atk:2,def:2,mid:3},strong:['4-3-3'],weak:['3-5-2'],
    layout:[{p:'GK',x:50,y:85},{p:'DF',x:14,y:67},{p:'DF',x:36,y:72},{p:'DF',x:64,y:72},{p:'DF',x:86,y:67},{p:'MF',x:34,y:54},{p:'MF',x:66,y:54},{p:'MF',x:17,y:36},{p:'MF',x:50,y:31},{p:'MF',x:83,y:36},{p:'FW',x:50,y:13}]},
} as const;
type Formation=keyof typeof FORMATIONS;

const WEATHER=[
  {name:'Cerah',icon:Sun,eff:{sta:0,pas:0},color:'text-yellow-400'},
  {name:'Berawan',icon:Cloud,eff:{sta:0,pas:0},color:'text-slate-400'},
  {name:'Hujan Lebat',icon:CloudRain,eff:{sta:-5,pas:-3},color:'text-blue-400'},
  {name:'Berangin',icon:Wind,eff:{sta:-2,pas:-4},color:'text-cyan-400'},
];

// ─── INITIAL SQUAD ───────────────────────────────────────────
const mkP=(id:number,name:string,pos:string,posInd:string,rating:number,price:number,nat:string,starter:boolean,age=26):Player=>({
  id,name,pos,posInd,rating,baseRating:rating,age,price,nationality:nat,starter,form:100,stamina:100,morale:100,
  yellowCards:0,matchYellows:0,redCard:false,suspended:false,injured:false,injuryWeeks:0,unhappy:0,goals:0,assists:0,matchesPlayed:0
});
const INITIAL_SQUAD:Player[]=[
  mkP(1,"Teja Paku Alam","GK","Kiper",76,4.3,"Indonesia",true,30),
  mkP(2,"Adam Przybek","GK","Kiper",69,1.7,"Wales",false,28),
  mkP(3,"Fitrah Maulana","GK","Kiper",65,0.43,"Indonesia",false,22),
  mkP(4,"Federico Barba","DF","Bek Tengah",81,8.7,"Italia",true,32),
  mkP(5,"Patricio Matricardi","DF","Bek Tengah",80,7.0,"Argentina",true,28),
  mkP(6,"Frans Putros","DF","Bek Tengah",79,6.1,"Irak",true,26),
  mkP(7,"Júlio César","DF","Bek Tengah",77,5.2,"Brasil",false,29),
  mkP(8,"Kakang Rudianto","DF","Bek Tengah",74,3.9,"Indonesia",false,21),
  mkP(9,"Layvin Kurzawa","DF","Bek Kiri",85,13.0,"Prancis",true,32),
  mkP(10,"Dion Markx","DF","Bek Kanan",79,6.1,"Belanda",false,24),
  mkP(11,"Thom Haye","MF","Gel. Bertahan",86,17.4,"Indonesia",true,29),
  mkP(12,"Alfeandra Dewangga","MF","Gel. Bertahan",74,3.9,"Indonesia",false,23),
  mkP(13,"Robi Darwis","MF","Gel. Bertahan",72,2.6,"Indonesia",false,22),
  mkP(14,"Marc Klok","MF","Gel. Tengah",80,7.0,"Indonesia",true,31),
  mkP(15,"Adam Alis","MF","Gel. Tengah",76,4.8,"Indonesia",true,30),
  mkP(16,"Berguinho","MF","Gel. Serang",75,4.3,"Brasil",true,27),
  mkP(17,"Luciano Guaycochea","MF","Gel. Serang",74,3.9,"Argentina",false,28),
  mkP(18,"Saddil Ramdani","FW","Sayap Kiri",78,5.7,"Indonesia",false,25),
  mkP(19,"Eliano Reijnders","FW","Sayap Kanan",83,10.4,"Indonesia",true,22),
  mkP(20,"Beckham Putra","FW","Sayap Kanan",79,6.1,"Indonesia",false,20),
  mkP(21,"Andrew Jung","FW","Depan Tengah",81,8.7,"Prancis",true,29),
  mkP(22,"Sergio Castel","FW","Depan Tengah",80,7.8,"Spanyol",false,30),
  mkP(23,"Uilliam","FW","Depan Tengah",75,4.3,"Brasil",false,26),
  mkP(24,"Ramon Tanque","FW","Depan Tengah",74,3.9,"Brasil",false,27),
];

// ─── OPPONENTS ───────────────────────────────────────────────
const OPPONENTS:Opponent[]=[
  {name:"Persija Jakarta",ovr:75.8,atk:76.2,mid:75.6,def:77.6,stadium:"JIS",isAway:false,formation:"4-3-3",
   scorers:["Rizky Ridho","Jordi Amat","Allano Brendon","Mauro Zijlstra","Van Basty Sousa"],
   color:"#ea580c",dangerPlayers:["Rizky Ridho (DF)","Mauro Zijlstra (FW)"],
   recentForm:["W","W","D","W","L"],isDerby:true,
   strengths:["Bek tengah Jordi Amat+Rizky Ridho sangat kuat","Dominasi Brasil di lini serang"],
   weaknesses:["Transisi belakang lambat","Kiper kurang pengalaman besar"],
   tacticalTip:"Serang cepat lewat sayap, Mauro Zijlstra bahaya di kotak penalti!",
   squad:[{name:"Nadeo Argawinata",pos:"GK",rating:80},{name:"Rizky Ridho",pos:"DF",rating:84},{name:"Jordi Amat",pos:"DF",rating:83},{name:"Shayne Pattynama",pos:"DF",rating:77},{name:"Dony Tri Pamungkas",pos:"DF",rating:73},{name:"Rayhan Hannan",pos:"MF",rating:75},{name:"Van Basty Sousa",pos:"MF",rating:77},{name:"Fabio Calonego",pos:"MF",rating:76},{name:"Allano Brendon",pos:"FW",rating:77},{name:"Mauro Zijlstra",pos:"FW",rating:79},{name:"Eksel Runtukahu",pos:"FW",rating:74}]},

  {name:"Bali United",ovr:75.4,atk:76.4,mid:77.4,def:74.3,stadium:"Kapten I Wayan Dipta",isAway:true,formation:"4-2-3-1",
   scorers:["Boris Kopitovic","Mirza Mustafic","Thijmen Goppel","Irfan Jaya"],
   color:"#dc2626",dangerPlayers:["Mirza Mustafic (MF)","Boris Kopitovic (FW)"],
   recentForm:["W","D","W","W","D"],isDerby:false,
   strengths:["Gelandang Mirza+Receveur dominan","Winger Goppel sangat aktif"],
   weaknesses:["Lini belakang tidak solid","Bergantung pada Mirza"],
   tacticalTip:"Blok lini tengah, jangan beri ruang Mirza Mustafic berkembang!",
   squad:[{name:"Mike Hauptmeijer",pos:"GK",rating:76},{name:"Joao Ferrari",pos:"DF",rating:75},{name:"Kadek Arel",pos:"DF",rating:74},{name:"Rizky Dwi Febrianto",pos:"DF",rating:73},{name:"Ricky Fajrin",pos:"DF",rating:72},{name:"Tim Receveur",pos:"MF",rating:80},{name:"Kadek Agung",pos:"MF",rating:72},{name:"Jordy Bruijn",pos:"MF",rating:79},{name:"Mirza Mustafic",pos:"MF",rating:83},{name:"Thijmen Goppel",pos:"FW",rating:83},{name:"Boris Kopitovic",pos:"FW",rating:80}]},

  {name:"Dewa United",ovr:75.2,atk:76.0,mid:75.8,def:73.8,stadium:"Indomilk Arena",isAway:false,formation:"4-3-3",
   scorers:["Alex Martins","Vinicius Duarte","Rafael Struick","Ricky Kambuaya"],
   color:"#7c3aed",dangerPlayers:["Alex Martins (FW)","Ricky Kambuaya (MF)"],
   recentForm:["W","W","D","W","W"],isDerby:false,
   strengths:["Performa paling konsisten musim ini","Lini serang kreatif"],
   weaknesses:["Pertahanan bisa ditembus lewat sayap","Rentan set piece"],
   tacticalTip:"Jaga sayap ketat, Dewa United sering serang dari sisi lebar!",
   squad:[{name:"Sonny Stevens",pos:"GK",rating:79},{name:"Rizky Faidan",pos:"DF",rating:75},{name:"Welber Jardim",pos:"DF",rating:77},{name:"Yohannes Benny",pos:"DF",rating:72},{name:"Rian Firmansyah",pos:"DF",rating:71},{name:"Ricky Kambuaya",pos:"MF",rating:79},{name:"Taisei Marukawa",pos:"MF",rating:80},{name:"Yusuf Amsal",pos:"MF",rating:74},{name:"Alex Martins",pos:"FW",rating:81},{name:"Vinicius Duarte",pos:"FW",rating:78},{name:"Rafael Struick",pos:"FW",rating:81}]},

  {name:"Borneo FC",ovr:74.6,atk:74.5,mid:78.8,def:71.1,stadium:"Segiri",isAway:true,formation:"4-3-3",
   scorers:["Mariano Peralta","David da Silva","Kei Hirose","Juan Felipe Villa"],
   color:"#f97316",dangerPlayers:["David da Silva (FW)","Mariano Peralta (FW)"],
   recentForm:["W","W","D","W","W"],isDerby:false,
   strengths:["David da Silva top scorer liga","Lini tengah paling dominan"],
   weaknesses:["Pertahanan porous","Kiper level rata-rata"],
   tacticalTip:"Pressing tinggi! Lini belakang Borneo panik kalau ditekan.",
   squad:[{name:"Nadeo Argawinata",pos:"GK",rating:80},{name:"Fajar Fathur Rahman",pos:"DF",rating:73},{name:"Renan Alves",pos:"DF",rating:74},{name:"Raul Haeres",pos:"DF",rating:73},{name:"Ferinando Pahabol",pos:"DF",rating:72},{name:"Juan Felipe Villa",pos:"MF",rating:81},{name:"Kei Hirose",pos:"MF",rating:80},{name:"Hendro Siswanto",pos:"MF",rating:72},{name:"Mariano Peralta",pos:"FW",rating:83},{name:"David da Silva",pos:"FW",rating:84},{name:"Lerby Eliandry",pos:"FW",rating:77}]},

  {name:"PSM Makassar",ovr:74.6,atk:75.8,mid:73.0,def:76.2,stadium:"Gelora BJ Habibie",isAway:false,formation:"4-2-3-1",
   scorers:["Alex Tanque","Jacques Medina","Dusan Lagator","Gledson Paixao"],
   color:"#dc2626",dangerPlayers:["Dusan Lagator (DF)","Alex Tanque (FW)"],
   recentForm:["L","D","L","D","L"],isDerby:false,
   strengths:["Pertahanan paling solid dengan Lagator+Fernandes","Pressing tinggi di kandang"],
   weaknesses:["Sedang dalam tren buruk","Lini tengah kurang kreatif"],
   tacticalTip:"Mereka lagi drop! Serangan awal untuk hancurkan mental mereka.",
   squad:[{name:"Hilman Syah",pos:"GK",rating:74},{name:"Dusan Lagator",pos:"DF",rating:80},{name:"Yuran Fernandes",pos:"DF",rating:80},{name:"Aloisio Neto",pos:"DF",rating:77},{name:"Victor Luiz",pos:"DF",rating:79},{name:"Gledson Paixao",pos:"MF",rating:78},{name:"Ananda Rehan",pos:"MF",rating:73},{name:"Sheriddin Boboev",pos:"MF",rating:76},{name:"Jacques Medina",pos:"MF",rating:77},{name:"Savio Roberto",pos:"FW",rating:75},{name:"Alex Tanque",pos:"FW",rating:78}]},

  {name:"Malut United",ovr:74.1,atk:76.0,mid:74.0,def:74.6,stadium:"Gelora Kie Raha",isAway:true,formation:"4-3-3",
   scorers:["Jorge Correa","Diego Martínez","Yakob Sayuri","Jonatan Miran"],
   color:"#0891b2",dangerPlayers:["Jorge Correa (FW)","Diego Martínez (FW)"],
   recentForm:["W","W","L","D","W"],isDerby:false,
   strengths:["Duet penyerang asing sangat tajam","Semangat kandang tinggi"],
   weaknesses:["Tidak berpengalaman di laga besar","Mudah panik"],
   tacticalTip:"Cetak gol cepat, mereka akan kehilangan fokus!",
   squad:[{name:"Cahya Supriadi",pos:"GK",rating:70},{name:"Yakob Sayuri",pos:"DF",rating:76},{name:"Alfin Tuasalamony",pos:"DF",rating:73},{name:"Rivaldo Soplanit",pos:"DF",rating:74},{name:"Imam Febrianto",pos:"DF",rating:71},{name:"Jonatan Miran",pos:"MF",rating:74},{name:"Rendy Juliansyah",pos:"MF",rating:72},{name:"Goran Causic",pos:"MF",rating:75},{name:"Diego Martínez",pos:"FW",rating:77},{name:"Jorge Correa",pos:"FW",rating:77},{name:"Mochammad Dicky",pos:"FW",rating:70}]},

  {name:"Persebaya",ovr:73.9,atk:76.0,mid:73.5,def:72.9,stadium:"Gelora Bung Tomo",isAway:false,formation:"4-2-3-1",
   scorers:["Bruno Moreira","Henhen Herdiana","Ramadhan Sananta","M.Fatchurrohman"],
   color:"#16a34a",dangerPlayers:["Bruno Moreira (FW)","Ramadhan Sananta (FW)"],
   recentForm:["W","D","W","L","W"],isDerby:false,
   strengths:["Green Force di kandang sangat berbahaya","Striker lokal Ramadhan tajam"],
   weaknesses:["Away form jelek","Lini tengah mudah ditembus"],
   tacticalTip:"Laga away — jaga konsentrasi dari awal hingga akhir!",
   squad:[{name:"Ernando Ari",pos:"GK",rating:77},{name:"Hansamu Yama",pos:"DF",rating:76},{name:"M.Fatchurrohman",pos:"DF",rating:74},{name:"Bagas Adi",pos:"DF",rating:72},{name:"Reva Adi Utama",pos:"DF",rating:71},{name:"Yusuf Meilana",pos:"MF",rating:75},{name:"Hendri Sainouri",pos:"MF",rating:73},{name:"Muhammad Hidayat",pos:"MF",rating:72},{name:"Bruno Moreira",pos:"FW",rating:80},{name:"Ramadhan Sananta",pos:"FW",rating:76},{name:"Henhen Herdiana",pos:"FW",rating:74}]},

  {name:"Bhayangkara",ovr:73.8,atk:75.2,mid:74.7,def:72.8,stadium:"PTIK Jakarta",isAway:true,formation:"4-3-3",
   scorers:["Alan Cardoso","Ryo Matsumura","Matias Mier","Rizky Eka Pratama"],
   color:"#1e40af",dangerPlayers:["Alan Cardoso (FW)","Ryo Matsumura (FW)"],
   recentForm:["W","D","W","L","D"],isDerby:false,
   strengths:["Alan Cardoso rekrutan baru tajam","Pressing tinggi di depan"],
   weaknesses:["Pertahanan tidak konsisten","Sering kelelahan di babak 2"],
   tacticalTip:"Tunggu babak 2! Mereka sering drop fisik setelah menit 60.",
   squad:[{name:"Novan Setya Sasongko",pos:"GK",rating:72},{name:"Muhammad Arifin",pos:"DF",rating:72},{name:"Thales Lira",pos:"DF",rating:74},{name:"Junior Brandao",pos:"DF",rating:73},{name:"Restu Ridho",pos:"DF",rating:71},{name:"Matias Mier",pos:"MF",rating:80},{name:"Rezaldi Hehanusa",pos:"MF",rating:75},{name:"Gustavo França",pos:"MF",rating:76},{name:"Alan Cardoso",pos:"FW",rating:77},{name:"Ryo Matsumura",pos:"FW",rating:78},{name:"Rizky Eka Pratama",pos:"FW",rating:73}]},

  {name:"Persis Solo",ovr:73.1,atk:75.4,mid:73.5,def:70.4,stadium:"Manahan",isAway:false,formation:"4-3-3",
   scorers:["Moussa Sidibé","Alfriyanto Nico","Sho Yamamoto","Yosia Piran"],
   color:"#dc2626",dangerPlayers:["Moussa Sidibé (FW)","Sho Yamamoto (MF)"],
   recentForm:["L","W","L","W","D"],isDerby:false,
   strengths:["Moussa Sidibé sangat berbahaya di sisi kanan","Kandang Manahan sulit dikunjungi"],
   weaknesses:["Lini belakang paling lemah di liga","Tidak punya bek berkualitas"],
   tacticalTip:"Serangan langsung! Serang terus pertahanan yang rawan ini.",
   squad:[{name:"Ernando Ari B.",pos:"GK",rating:72},{name:"Alfriyanto Nico",pos:"DF",rating:74},{name:"Elias Dolah",pos:"DF",rating:71},{name:"Ricky Cawor",pos:"DF",rating:70},{name:"Dony Pratama",pos:"DF",rating:69},{name:"Sho Yamamoto",pos:"MF",rating:76},{name:"Stefano Lilipaly",pos:"MF",rating:77},{name:"Yosia Piran",pos:"MF",rating:72},{name:"Moussa Sidibé",pos:"FW",rating:79},{name:"Thomas Dole",pos:"FW",rating:73},{name:"Ferdinand Sinaga",pos:"FW",rating:71}]},

  {name:"Persik Kediri",ovr:73.0,atk:73.6,mid:74.5,def:72.5,stadium:"Brawijaya",isAway:true,formation:"4-4-2",
   scorers:["Adrian Luna","Zé Valente","Rohit Chand","Rishadi Fauzi"],
   color:"#16a34a",dangerPlayers:["Adrian Luna (FW)","Zé Valente (MF)"],
   recentForm:["W","W","D","W","W"],isDerby:false,
   strengths:["Form terbaik liga sekarang","Rohit Chand gelandang bertahan solid"],
   weaknesses:["Tidak punya pemain bintang kelas A","Away form tidak meyakinkan"],
   tacticalTip:"Waspada! Jangan anggap remeh mereka yang lagi on fire.",
   squad:[{name:"Bagas Kaffa",pos:"GK",rating:71},{name:"Rishadi Fauzi",pos:"DF",rating:73},{name:"Marcos Reina",pos:"DF",rating:74},{name:"Faqih Maulana",pos:"DF",rating:72},{name:"David Rumakiek",pos:"DF",rating:71},{name:"Rohit Chand",pos:"MF",rating:75},{name:"Zé Valente",pos:"MF",rating:77},{name:"Silvio Escobar",pos:"MF",rating:74},{name:"Adrian Luna",pos:"FW",rating:79},{name:"Yudha Tri Kusuma",pos:"FW",rating:71},{name:"Siswanto",pos:"FW",rating:70}]},

  {name:"Arema FC",ovr:73.2,atk:72.6,mid:74.0,def:73.0,stadium:"Kanjuruhan",isAway:false,formation:"4-3-3",
   scorers:["Dalberto","Hansamu Yama","Rio Fahmi","Arkhan Fikri"],
   color:"#1e3a8a",dangerPlayers:["Dalberto (FW)","Arkhan Fikri (MF)"],
   recentForm:["L","D","L","D","L"],isDerby:false,
   strengths:["Aremania fanatik tapi hasil jelek","Solid bertahan di kandang"],
   weaknesses:["Tren negatif panjang","Menyerang sangat tidak produktif"],
   tacticalTip:"Mereka dalam krisis! Tekan sejak menit pertama untuk menghancurkan moral.",
   squad:[{name:"Adilson Ferreira",pos:"GK",rating:73},{name:"Hansamu Yama",pos:"DF",rating:76},{name:"Rio Fahmi",pos:"DF",rating:77},{name:"Syaiful Indra",pos:"DF",rating:72},{name:"Rendy Oscario",pos:"DF",rating:71},{name:"Arkhan Fikri",pos:"MF",rating:76},{name:"Dendi Santoso",pos:"MF",rating:74},{name:"Gustavo França",pos:"MF",rating:76},{name:"Dalberto",pos:"FW",rating:77},{name:"Dedik Setiawan",pos:"FW",rating:73},{name:"Carlos Fortes",pos:"FW",rating:74}]},

  {name:"PSBS Biak",ovr:72.8,atk:75.0,mid:74.5,def:71.0,stadium:"Mandala Biak",isAway:true,formation:"3-5-2",
   scorers:["Jonata Machado","Abel Argañaraz","Julián Velázquez","George Brown"],
   color:"#0369a1",dangerPlayers:["Jonata Machado (MF)","Abel Argañaraz (FW)"],
   recentForm:["W","D","W","L","W"],isDerby:false,
   strengths:["Gelandang asing berkualitas tinggi","Semangat Papua tinggi"],
   weaknesses:["Tiga bek mudah ditembus lewat sisi","Tidak ada kiper berkelas"],
   tacticalTip:"Serang lewat sisi lebar! Formasi 3 bek mereka punya celah di sayap.",
   squad:[{name:"Ramdani Lestaluhu",pos:"GK",rating:68},{name:"Julián Velázquez",pos:"DF",rating:75},{name:"George Brown",pos:"DF",rating:74},{name:"Jefri Kurniawan",pos:"DF",rating:71},{name:"Jonata Machado",pos:"MF",rating:77},{name:"Hendra Sandi",pos:"MF",rating:70},{name:"Alfredo Vera",pos:"MF",rating:76},{name:"Jefferson Lopes",pos:"MF",rating:74},{name:"Jesús Álvarez",pos:"MF",rating:73},{name:"Abel Argañaraz",pos:"FW",rating:77},{name:"Ryan Bakri",pos:"FW",rating:70}]},

  {name:"Semen Padang",ovr:72.8,atk:73.0,mid:75.3,def:72.5,stadium:"Haji Agus Salim",isAway:false,formation:"4-2-3-1",
   scorers:["Charlie Scott","Irsyad Maulana","Bruno Dybal","Tin Martic"],
   color:"#7c3aed",dangerPlayers:["Charlie Scott (MF)","Irsyad Maulana (FW)"],
   recentForm:["W","D","W","W","D"],isDerby:false,
   strengths:["Kompak dan disiplin di kandang","Irsyad Maulana pemain lokal terbaik mereka"],
   weaknesses:["Serangan sangat bergantung pada Charlie Scott","Lemah di laga tandang"],
   tacticalTip:"Matikan Charlie Scott, serangan Semen Padang akan mati total.",
   squad:[{name:"Renald Pratama",pos:"GK",rating:69},{name:"Tin Martic",pos:"DF",rating:75},{name:"Ricky Fajrin Saputera",pos:"DF",rating:72},{name:"Wahyu Subo",pos:"DF",rating:70},{name:"Novan Hardiansyah",pos:"DF",rating:69},{name:"Charlie Scott",pos:"MF",rating:77},{name:"Bruno Dybal",pos:"MF",rating:75},{name:"Rendi Irawan",pos:"MF",rating:71},{name:"Beny Wahyudi",pos:"MF",rating:70},{name:"Irsyad Maulana",pos:"FW",rating:73},{name:"Beni Oktavianto",pos:"FW",rating:70}]},

  {name:"Persita",ovr:72.3,atk:71.6,mid:72.8,def:73.2,stadium:"Sport Center Tangerang",isAway:true,formation:"4-4-2",
   scorers:["Marios Ogkmpoe","Aleksa Vukanovic","Javlon Guseynov","Andhika Ramadhani"],
   color:"#0891b2",dangerPlayers:["Aleksa Vukanovic (FW)","Marios Ogkmpoe (FW)"],
   recentForm:["W","W","W","D","W"],isDerby:false,
   strengths:["Aleksa Vukanovic striker berbahaya","Form sedang sangat bagus"],
   weaknesses:["Bergantung total pada 2 striker asing","Lini tengah pas-pasan"],
   tacticalTip:"Jangan sepelekan form mereka! Matikan Vukanovic dari awal.",
   squad:[{name:"Angga Saputro",pos:"GK",rating:72},{name:"Javlon Guseynov",pos:"DF",rating:74},{name:"Renshi Yamaguchi",pos:"DF",rating:73},{name:"Andhika Ramadhani",pos:"DF",rating:72},{name:"Faisol Azhar",pos:"DF",rating:70},{name:"Bruno da Cruz",pos:"MF",rating:74},{name:"Ferinando Pahabol",pos:"MF",rating:72},{name:"Ade Jantra",pos:"MF",rating:71},{name:"Edo Febrianto",pos:"MF",rating:70},{name:"Marios Ogkmpoe",pos:"FW",rating:75},{name:"Aleksa Vukanovic",pos:"FW",rating:76}]},

  {name:"Madura United",ovr:71.1,atk:69.6,mid:74.0,def:70.8,stadium:"Gelora Bangkalan",isAway:false,formation:"5-3-2",
   scorers:["Jordy Wehrmann","Maxuel","Pedro Monteiro","Esteban Vizcaino"],
   color:"#dc2626",dangerPlayers:["Jordy Wehrmann (MF)","Maxuel (FW)"],
   recentForm:["D","L","W","D","L"],isDerby:false,
   strengths:["Blok pertahanan 5 bek sangat sulit ditembus","Jordy Wehrmann motor tengah"],
   weaknesses:["Serangan tumpul","Tidak punya striker berkelas"],
   tacticalTip:"Bersabar, butuh kesabaran untuk menembus tembok mereka!",
   squad:[{name:"Satria Tama",pos:"GK",rating:71},{name:"Pedro Monteiro",pos:"DF",rating:75},{name:"Bagas Rafi",pos:"DF",rating:70},{name:"Esteban Vizcaino",pos:"DF",rating:74},{name:"Farizal Kasman",pos:"DF",rating:69},{name:"Hendrigo Siswanto",pos:"DF",rating:68},{name:"Jordy Wehrmann",pos:"MF",rating:79},{name:"Hargianto",pos:"MF",rating:71},{name:"M.Rivaldi Bawuo",pos:"MF",rating:70},{name:"Maxuel",pos:"FW",rating:75},{name:"Ali Hasan Asadalla",pos:"FW",rating:68}]},

  {name:"PSIM Jogja",ovr:68.9,atk:70.2,mid:68.5,def:68.2,stadium:"Mandala Krida",isAway:true,formation:"4-3-3",
   scorers:["Aleksandar Rakic","Yudha Alkanza","Sugeng Efendi","Dani Rombelo"],
   color:"#f97316",dangerPlayers:["Aleksandar Rakic (FW)","Yudha Alkanza (MF)"],
   recentForm:["W","L","D","W","L"],isDerby:false,
   strengths:["Ambisius sebagai tim promosi","Motivasi tinggi buktikan diri"],
   weaknesses:["Kualitas pemain jauh di bawah rata-rata","Tidak ada pemain bintang"],
   tacticalTip:"Mainkan tim terbaik dan menang besar — poin bisa sangat berharga!",
   squad:[{name:"Angga Febri Nugroho",pos:"GK",rating:68},{name:"Fauzan Fajri",pos:"DF",rating:67},{name:"Akbar Rozak",pos:"DF",rating:67},{name:"Hasyim Kipuw",pos:"DF",rating:66},{name:"Dani Rombelo",pos:"DF",rating:68},{name:"Yudha Alkanza",pos:"MF",rating:70},{name:"Mahdi Fahri",pos:"MF",rating:67},{name:"Gilang Ginarsa",pos:"MF",rating:66},{name:"Aleksandar Rakic",pos:"FW",rating:72},{name:"Sugeng Efendi",pos:"FW",rating:70},{name:"Munandar",pos:"FW",rating:65}]},

  {name:"Persijap Jepara",ovr:68.3,atk:68.0,mid:68.8,def:68.2,stadium:"Gelora Bumi Kartini",isAway:false,formation:"4-4-2",
   scorers:["Kervens Belfort","Wahyu Prasetyo","Mojtaba Lotfi","Fikron Afriyanto"],
   color:"#059669",dangerPlayers:["Kervens Belfort (MF)","Wahyu Prasetyo (FW)"],
   recentForm:["D","W","W","L","W"],isDerby:false,
   strengths:["Motivasi tim promosi sangat tinggi","Kompak dan solid"],
   weaknesses:["Rating paling rendah di liga","Pengalaman di level ini kurang"],
   tacticalTip:"Dominasi dari menit pertama, jangan beri mereka kepercayaan diri!",
   squad:[{name:"Samudera Alif",pos:"GK",rating:68},{name:"Mojtaba Lotfi",pos:"DF",rating:70},{name:"Fikron Afriyanto",pos:"DF",rating:69},{name:"M.Rivaldi",pos:"DF",rating:67},{name:"Andri Putra",pos:"DF",rating:66},{name:"Kervens Belfort",pos:"MF",rating:72},{name:"Anton Gustavo",pos:"MF",rating:68},{name:"Hendra Sandi",pos:"MF",rating:67},{name:"Ahmad Saeful",pos:"MF",rating:66},{name:"Wahyu Prasetyo",pos:"FW",rating:67},{name:"Reza Pratama",pos:"FW",rating:66}]},
];
const INITIAL_STANDINGS:Standing[]=[
  {name:"Persib Bandung",played:0,won:0,draw:0,lost:0,gf:0,ga:0,points:0,color:"#0047AB"},
  ...OPPONENTS.map(o=>({name:o.name,played:0,won:0,draw:0,lost:0,gf:0,ga:0,points:0,color:o.color}))
];

// ─── DECISION MOMENTS ────────────────────────────────────────
const DECISIONS:MatchDecision[]=[
  {minute:0,situation:"Pemain lawan terpincang parah setelah tackle keras. Kamu bisa instruksikan terus tekan atau beri waktu.",options:[{label:"Tekan terus!",emoji:"⚡",effect:"goal"},{label:"Fair Play — beri ruang",emoji:"🤝",effect:"morale_boost"},{label:"Jaga posisi dulu",emoji:"🛡️",effect:"nothing"}]},
  {minute:0,situation:"Serangan balik cepat terbuka! Eliano punya ruang lebar. Oper ke striker atau tembak sendiri?",options:[{label:"Oper ke striker!",emoji:"↗️",effect:"goal"},{label:"Tembak sendiri!",emoji:"🎯",effect:"goal"},{label:"Jaga bola dulu",emoji:"🔄",effect:"nothing"}]},
  {minute:0,situation:"Lawan dapat tendangan bebas berbahaya. Intruksikan pagar betis atau maju pressing?",options:[{label:"Pagar betis rapat!",emoji:"🧱",effect:"nothing"},{label:"Maju pressing!",emoji:"🏃",effect:"miss"},{label:"Percayakan kiper",emoji:"🧤",effect:"nothing"}]},
  {minute:0,situation:"Pemain kita kelelahan di menit 70. Apakah diganti atau tetap mainkan?",options:[{label:"Ganti pemain!",emoji:"🔄",effect:"nothing"},{label:"Tetap mainkan",emoji:"💪",effect:"injury_risk"},{label:"Minta berlari lebih lambat",emoji:"🚶",effect:"nothing"}]},
  {minute:0,situation:"Wasit hampir memberikan kartu untuk pemain kita. Protes atau terima?",options:[{label:"Protes keras wasit!",emoji:"😤",effect:"card"},{label:"Terima & tenang",emoji:"🤐",effect:"nothing"},{label:"Minta kapten bicara",emoji:"🗣️",effect:"nothing"}]},
  {minute:0,situation:"Unggul tipis 5 menit terakhir. Buang waktu atau tetap menyerang?",options:[{label:"Buang waktu!",emoji:"⏱️",effect:"nothing"},{label:"Serang tambah gol!",emoji:"⚽",effect:"goal"},{label:"Bertahan total",emoji:"🛡️",effect:"nothing"}]},
];

// ─── COMMENTARY ──────────────────────────────────────────────
const GOAL_P=["Serangan balik mematikan!","Tendangan keras dari luar kotak!","Sundulan dari sudut!","One-two cantik di kotak penalti!","Umpan silang sempurna!","Pressing tinggi berbuah gol!","Gol solo run spektakuler!","Tendangan bebas melengkung indah!"];
const GOAL_O=["Kesalahan passing berbahaya","Kiper keluar terlalu jauh","Pertahanan lengah","Set piece tidak dijaga","Counter-attack kilat","Blunder bek terakhir","Kehilangan bola di area gawang"];
const COMM_CHANCE=["Tembakan keras! Tepian tiang!","Sundulan berbahaya, melambung!","Crossing matang, tidak ada yang sentuh!","Tembakan dari jarak jauh diblok!","Peluang terbuka! Tapi meleset!","Kiper! Penyelamatan brilian!"];
const COMM_POSS=["Membangun serangan perlahan...","Bola dikuasai lini tengah...","Formasi solid, menunggu celah...","Pergulatan sengit di tengah...","Pressing semakin intens...","Menguji pertahanan lawan..."];
const COMM_SAVE=["PENYELAMATAN GEMILANG kiper!","Bola membentur mistar!","Blok heroik di garis gawang!","Kiper terbang parahi sudut!"];
const INTENSITY_LABELS={Lembut:"⚖️ Lembut",Sedang:"💪 Sedang",Kasar:"🔥 Kasar"};

// ─── SOUND ───────────────────────────────────────────────────
function useSound(){
  const ctx=useRef<AudioContext|null>(null);
  const init=useCallback(()=>{if(!ctx.current)ctx.current=new(window.AudioContext||(window as unknown as{webkitAudioContext:typeof AudioContext}).webkitAudioContext)();return ctx.current;},[]);
  const note=useCallback((f:number,d:number,t:OscillatorType='sine',v=0.08,delay=0)=>{
    try{const c=init(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=f;o.type=t;const s=c.currentTime+delay;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(v,s+0.02);g.gain.exponentialRampToValueAtTime(0.001,s+d);o.start(s);o.stop(s+d);}catch{}
  },[init]);
  const playGoal=useCallback(()=>{note(523,0.3,'sine',0.1);note(659,0.3,'sine',0.1,0.1);note(784,0.4,'sine',0.12,0.2);note(1047,0.6,'sine',0.15,0.35);},[note]);
  const playWhistle=useCallback(()=>{note(1200,0.15,'sine',0.06);note(1400,0.15,'sine',0.06,0.18);note(1200,0.3,'sine',0.08,0.36);},[note]);
  const playClick=useCallback(()=>note(800,0.05,'sine',0.04),[note]);
  const playWin=useCallback(()=>{[0,0.12,0.24,0.36].forEach((d,i)=>note([523,659,784,1047][i],0.4,'sine',0.1,d));},[note]);
  const playCrowd=useCallback(()=>{note(150,0.4,'sawtooth',0.02);note(200,0.3,'sawtooth',0.02,0.1);},[note]);
  return{playGoal,playWhistle,playClick,playWin,playCrowd};
}

// ─── BACKGROUND ──────────────────────────────────────────────
const TigerBg=()=>(
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950"/>
    <svg className="absolute inset-0 w-full h-full opacity-[0.05]" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      <defs><pattern id="tp" x="0" y="0" width="80" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
        <path d="M0 0 Q20 10 15 30 Q10 50 25 60 Q40 70 35 90 Q30 110 50 120 L55 120 Q35 110 40 90 Q45 70 30 60 Q15 50 20 30 Q25 10 5 0Z" fill="#f59e0b" opacity="0.9"/>
        <path d="M40 15 Q55 25 50 45 Q45 60 58 72 L63 72 Q50 60 55 45 Q60 25 45 15Z" fill="#f59e0b" opacity="0.6"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#tp)"/>
    </svg>
    <div className="absolute top-[-20%] left-[-15%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[150px]"/>
    <div className="absolute bottom-[-20%] right-[-15%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]"/>
  </div>
);
const Glass=({className='',children,...p}:React.ComponentProps<'div'>)=>(
  <div className={`bg-white/8 backdrop-blur-xl border border-white/12 shadow-2xl rounded-2xl ${className}`}{...p}>{children}</div>
);

// ─── GOAL TOAST ──────────────────────────────────────────────
const GoalToast=({scorer,assist,minute,isP,onDone}:{scorer:string;assist:string|null;minute:number;isP:boolean;onDone:()=>void})=>{
  useEffect(()=>{const t=setTimeout(onDone,3500);return()=>clearTimeout(t);},[onDone]);
  return(
    <motion.div initial={{x:300,opacity:0}}animate={{x:0,opacity:1}}exit={{x:300,opacity:0}}transition={{type:'spring',stiffness:300,damping:30}}
      className={`fixed top-20 right-3 z-50 w-64 rounded-2xl border shadow-2xl p-4 backdrop-blur-xl ${isP?'bg-blue-900/95 border-amber-400/50':'bg-red-900/95 border-red-400/30'}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{isP?'⚽':'😔'}</div>
        <div className="flex-1 min-w-0">
          <div className={`text-[10px] font-black tracking-widest mb-1 ${isP?'text-amber-400':'text-red-400'}`}>{isP?`GOL PERSIB! ${minute}'`:`GOL LAWAN! ${minute}'`}</div>
          <div className="text-sm font-bold text-white truncate">{scorer}</div>
          {assist&&<div className="text-[10px] text-white/60 mt-0.5">Assist: {assist}</div>}
        </div>
      </div>
      {isP&&<motion.div initial={{width:'100%'}}animate={{width:'0%'}}transition={{duration:3.5,ease:'linear'}}className="h-0.5 bg-amber-400/50 mt-3 rounded-full"/>}
    </motion.div>
  );
};
const Confetti=({active}:{active:boolean})=>{
  if(!active)return null;
  return(<div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    {Array.from({length:40}).map((_,i)=>(
      <motion.div key={i} className="absolute w-2.5 h-2.5"
        initial={{top:-20,left:`${Math.random()*100}%`,rotate:0,opacity:1}}animate={{top:'110%',rotate:720,opacity:0}}
        transition={{duration:2+Math.random()*2,delay:Math.random()*0.8,ease:'easeOut'}}
        style={{backgroundColor:['#0047AB','#FFD700','#fff','#3b82f6','#fbbf24'][i%5],borderRadius:i%2===0?'50%':'2px'}}/>
    ))}
  </div>);
};

// ─── CONDITION HELPER (module level) ─────────────────────────
const getCondition=(p:Player):{label:string;color:string;dot:string;formPenalty:number}=>{
  const fit=Math.round((p.form/100*0.5+p.stamina/100*0.5)*100);
  if(p.injured)   return{label:`Cedera (${p.injuryWeeks}w)`,color:'text-red-400',   dot:'#ef4444',formPenalty:0};
  if(p.suspended) return{label:'Suspensi',              color:'text-purple-400', dot:'#a855f7',formPenalty:0};
  if(fit>=85)     return{label:'Fresh',                  color:'text-green-400',  dot:'#22c55e',formPenalty:0};
  if(fit>=70)     return{label:'Fit',                    color:'text-emerald-400',dot:'#10b981',formPenalty:0};
  if(fit>=55)     return{label:'Lelah',                  color:'text-amber-400',  dot:'#f59e0b',formPenalty:8};
  if(fit>=40)     return{label:'Kelelahan',              color:'text-orange-400', dot:'#f97316',formPenalty:15};
  return          {label:'Drop Fisik',                   color:'text-red-500',    dot:'#dc2626',formPenalty:20};
};


// Bench-tap → slot-tap placement, tap-on-pitch swap, fitness dot, rating badge
const posColors:Record<string,string>={GK:'#d97706',DF:'#1d4ed8',MF:'#059669',FW:'#dc2626'};

const FormationPitch=({
  formation, squad, onSquadChange, readOnly=false, size='normal',
}:{
  formation:Formation;
  squad:Player[];
  onSquadChange?:(sq:Player[])=>void;
  readOnly?:boolean;
  size?:'normal'|'small';
})=>{
  const [selBench,setSelBench]=useState<number|null>(null); // id of selected bench player
  const [selSlot,setSelSlot]=useState<number|null>(null);   // index of selected starter slot

  const slots=FORMATIONS[formation].layout;
  const starters=squad.filter(p=>p.starter&&!p.injured&&!p.redCard&&!p.suspended);
  const bench=squad.filter(p=>!p.starter);

  // Map slot → player: match by position in order
  const grouped:Record<string,Player[]>={};
  starters.forEach(p=>{if(!grouped[p.pos])grouped[p.pos]=[];grouped[p.pos].push(p);});
  const posIdx:Record<string,number>={};
  const slotPlayers=slots.map(s=>{
    const pos=s.p as string;
    if(!posIdx[pos])posIdx[pos]=0;
    const pl=grouped[pos]?.[posIdx[pos]];
    posIdx[pos]++;
    return pl??null;
  });

  const fitness=(p:Player)=>Math.round((p.form/100*0.5+p.stamina/100*0.5)*100);

  const updateSquad=(fn:(sq:Player[])=>Player[])=>{
    if(onSquadChange) onSquadChange(fn([...squad]));
  };

  const handleSlotTap=(slotIdx:number)=>{
    if(readOnly)return;
    const occupant=slotPlayers[slotIdx];
    const slotPos=slots[slotIdx].p as string;

    // Case 1: bench player selected → place into slot
    if(selBench!==null){
      const bp=squad.find(p=>p.id===selBench);
      if(!bp){setSelBench(null);return;}
      updateSquad(sq=>{
        // remove bench player from any existing slot first
        const next=sq.map(p=>p.id===bp.id?{...p,starter:true,pos:slotPos,posInd:p.posInd}:p);
        // if slot was occupied, send occupant to bench
        if(occupant) return next.map(p=>p.id===occupant.id?{...p,starter:false}:p);
        return next;
      });
      setSelBench(null);return;
    }

    // Case 2: another slot selected → swap
    if(selSlot!==null&&selSlot!==slotIdx){
      const pA=slotPlayers[selSlot];
      const pB=slotPlayers[slotIdx];
      updateSquad(sq=>{
        return sq.map(p=>{
          if(pA&&p.id===pA.id)return{...p,pos:slots[slotIdx].p as string};
          if(pB&&p.id===pB.id)return{...p,pos:slots[selSlot].p as string};
          return p;
        });
      });
      setSelSlot(null);return;
    }

    // Case 3: tap occupied slot → select for swap or send to bench
    if(occupant){
      if(selSlot===slotIdx){setSelSlot(null);}
      else{setSelSlot(slotIdx);}
      return;
    }
    setSelSlot(null);
  };

  const handleBenchTap=(id:number)=>{
    if(readOnly)return;
    // If tapping already-on-pitch player from bench list — remove from pitch
    const p=squad.find(x=>x.id===id);
    if(!p)return;
    if(selSlot!==null){setSelSlot(null);}
    if(selBench===id){setSelBench(null);}
    else{setSelBench(id);}
  };

  const isSmall=size==='small';
  const pitchAspect=isSmall?'aspect-[5/4]':'aspect-[3/4]';

  return(
    <div className="w-full">
      {/* PITCH */}
      <div className={`relative w-full ${pitchAspect} rounded-xl overflow-hidden border border-emerald-700/50 shadow-xl`}
        style={{background:'linear-gradient(180deg,#15532e 0%,#166534 18%,#15532e 36%,#166534 54%,#15532e 72%,#166534 90%,#15532e 100%)'}}>
        {/* SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 150" preserveAspectRatio="none">
          <rect x="4" y="3" width="92" height="144" rx="1.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7"/>
          <line x1="4" y1="75" x2="96" y2="75" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6"/>
          <circle cx="50" cy="75" r="13" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6"/>
          <circle cx="50" cy="75" r="1" fill="rgba(255,255,255,0.35)"/>
          <rect x="22" y="3" width="56" height="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.55"/>
          <rect x="36" y="3" width="28" height="7" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.5"/>
          <circle cx="50" cy="15" r="0.9" fill="rgba(255,255,255,0.4)"/>
          <path d="M36 23 A14 14 0 0 1 64 23" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.5"/>
          <rect x="22" y="127" width="56" height="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.55"/>
          <rect x="36" y="139" width="28" height="7" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.5"/>
          <circle cx="50" cy="135" r="0.9" fill="rgba(255,255,255,0.4)"/>
          <path d="M36 127 A14 14 0 0 0 64 127" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.5"/>
          <rect x="40" y="1" width="20" height="3" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6"/>
          <rect x="40" y="146" width="20" height="3" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6"/>
          <circle cx="4" cy="3" r="2" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4"/>
          <circle cx="96" cy="3" r="2" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4"/>
          <circle cx="4" cy="147" r="2" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4"/>
          <circle cx="96" cy="147" r="2" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4"/>
        </svg>

        {/* Player slots */}
        {slots.map((slot,i)=>{
          const pl=slotPlayers[i];
          const isSelSlot=selSlot===i;
          const isRed=pl?.redCard||((pl?.matchYellows??0)>=2);
          const fit=pl?fitness(pl):0;
          const bg=pl&&!isRed?posColors[slot.p as string]:'rgba(255,255,255,0.1)';
          const w=isSmall?24:34;
          const fs=isSmall?8:10;

          return(
            <div key={i} className="absolute flex flex-col items-center"
              style={{left:`${slot.x}%`,top:`${slot.y}%`,transform:'translate(-50%,-50%)',zIndex:isSelSlot?20:2,
                cursor:readOnly?'default':'pointer'}}>
              <motion.div
                whileTap={readOnly?{}:{scale:0.88}}
                onClick={()=>handleSlotTap(i)}
                style={{
                  width:w,height:w,borderRadius:'50%',
                  background:bg,
                  border:`2px solid ${isSelSlot?'#fbbf24':pl?'rgba(255,255,255,0.45)':'rgba(255,255,255,0.2)'}`,
                  boxShadow:isSelSlot?'0 0 0 3px #fbbf24, 0 4px 12px rgba(0,0,0,0.5)':'0 2px 8px rgba(0,0,0,0.4)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color:'white',fontWeight:800,fontSize:fs,
                  transition:'all 0.15s',
                  opacity:pl?1:0.35,
                  position:'relative',
                }}>
                {pl?pl.rating:slot.p[0]}
                {/* Rating badge */}
                {pl&&!isSmall&&(
                  <div style={{position:'absolute',top:-5,right:-5,background:'#fbbf24',color:'#000',
                    fontSize:6,fontWeight:900,width:13,height:13,borderRadius:'50%',
                    display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>
                    {pl.rating}
                  </div>
                )}
                {/* Fitness/condition dot */}
                {pl&&<div style={{position:'absolute',bottom:-3,left:'50%',transform:'translateX(-50%)',
                  width:5,height:5,borderRadius:'50%',background:getCondition(pl).dot,
                  border:'1px solid rgba(0,0,0,0.4)'}}/>}
              </motion.div>
              {/* Name label */}
              <div style={{
                marginTop:2,fontSize:isSmall?6:7,fontWeight:600,color:'rgba(255,255,255,0.92)',
                background:'rgba(0,0,0,0.55)',padding:'1px 4px',borderRadius:3,
                maxWidth:isSmall?40:52,textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                lineHeight:1.3,
              }}>
                {pl?(isRed?'🟥':(pl.injured?'🚑':pl.name.split(' ').pop()??pl.name)):slot.p}
              </div>
            </div>
          );
        })}

        {/* Formation watermark */}
        <div style={{position:'absolute',bottom:6,right:8,fontSize:9,fontWeight:900,
          color:'rgba(255,255,255,0.3)',letterSpacing:1}}>{formation}</div>

        {/* Hint overlay when bench player selected */}
        {selBench!==null&&(
          <div style={{position:'absolute',top:6,left:'50%',transform:'translateX(-50%)',
            background:'rgba(251,191,36,0.9)',color:'#000',fontSize:8,fontWeight:700,
            padding:'3px 10px',borderRadius:99,whiteSpace:'nowrap'}}>
            Tap slot untuk tempatkan
          </div>
        )}
        {selSlot!==null&&(
          <div style={{position:'absolute',top:6,left:'50%',transform:'translateX(-50%)',
            background:'rgba(96,165,250,0.9)',color:'#000',fontSize:8,fontWeight:700,
            padding:'3px 10px',borderRadius:99,whiteSpace:'nowrap'}}>
            Tap slot lain untuk tukar posisi
          </div>
        )}
      </div>

      {/* BENCH — only shown in non-readonly full size */}
      {!readOnly&&!isSmall&&(
        <div className="mt-3">
          <div className="text-[10px] text-slate-400 font-semibold mb-2">
            BENCH ({bench.filter(p=>!p.injured).length} tersedia)
            {selBench&&<span className="ml-2 text-amber-400">→ Tap slot di atas</span>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {bench.map(p=>{
              const isSel=selBench===p.id;
              const fit=fitness(p);
              return(
                <div key={p.id} onClick={()=>!p.injured&&handleBenchTap(p.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border transition cursor-pointer
                    ${isSel?'border-amber-400 bg-amber-500/15':'border-white/10 bg-white/5 hover:bg-white/10'}
                    ${p.injured?'opacity-30 cursor-not-allowed':''}`}
                  style={{minWidth:52}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:posColors[p.pos],
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:9,fontWeight:800,color:'white',
                    boxShadow:'0 2px 6px rgba(0,0,0,0.35)',
                    border:isSel?'2px solid #fbbf24':'2px solid rgba(255,255,255,0.3)'}}>
                    {p.pos[0]}
                  </div>
                  <div style={{fontSize:7,fontWeight:600,color:'rgba(255,255,255,0.85)',textAlign:'center',
                    maxWidth:48,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {p.name.split(' ').pop()??p.name}
                  </div>
                  <div style={{fontSize:8,fontWeight:700,color:'#fbbf24'}}>{p.rating}</div>
                  {/* Fitness bar */}
                  <div style={{width:28,height:2,borderRadius:2,background:'rgba(255,255,255,0.1)'}}>
                    <div style={{height:'100%',borderRadius:2,width:`${fit}%`,background:getCondition(p).dot}}/>
                  </div>
                  {p.injured&&<div style={{fontSize:7,color:'#ef4444',fontWeight:700}}>🚑 Cedera</div>}
                  {p.suspended&&<div style={{fontSize:7,color:'#a855f7',fontWeight:700}}>🚫 Suspensi</div>}
                  {!p.injured&&!p.suspended&&getCondition(p).formPenalty>0&&<div style={{fontSize:6,fontWeight:700,color:getCondition(p).dot}}>{getCondition(p).label}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SELL REASON MODAL ───────────────────────────────────────
const SellModal=({player,onConfirm,onCancel}:{player:Player;onConfirm:(reason:string)=>void;onCancel:()=>void})=>{
  const [reason,setReason]=useState('');
  const reasons=["Tidak cocok formasi","Sudah terlalu tua","Ada pemain lebih baik","Butuh dana transfer","Konflik dengan tim","Kembali ke klub asal"];
  const sp=+(player.price*0.8).toFixed(1);
  return(
    <motion.div initial={{opacity:0}}animate={{opacity:1}}exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-4"
      onClick={onCancel}>
      <motion.div initial={{y:100}}animate={{y:0}}exit={{y:100}}transition={{type:'spring',stiffness:300,damping:30}}
        onClick={e=>e.stopPropagation()}
        className="w-full max-w-xs bg-slate-900/98 border border-white/20 rounded-2xl p-5 shadow-2xl">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-white">Jual Pemain</h3>
            <p className="text-xs text-slate-400 mt-0.5">{player.name} · +{sp}M</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>
        <p className="text-[10px] text-slate-400 mb-2">Pilih alasan penjualan:</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {reasons.map(r=>(
            <button key={r} onClick={()=>setReason(r)}
              className={`p-2 text-[10px] rounded-xl border text-left transition ${reason===r?'bg-blue-600/30 border-blue-500/50 text-blue-300':'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-500/50'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-slate-300 font-semibold text-sm">Batal</button>
          <button onClick={()=>reason&&onConfirm(reason)} disabled={!reason}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${reason?'bg-red-600 hover:bg-red-500 text-white':'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
            Jual
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function PersibManager(){
  const[phase,setPhase]=useState<'intro'|'trivia'|'welcome'|'game'>('intro');
  const[managerName,setManagerName]=useState('');
  const[managerRegion,setManagerRegion]=useState('');
  const[tmpName,setTmpName]=useState('');
  const[tmpRegion,setTmpRegion]=useState('');

  type Screen='home'|'tactics'|'market'|'match'|'stats'|'preview'|'champion-preview'|'matchweek-results'|'end';
  const[screen,setScreen]=useState<Screen>('home');
  const[squad,setSquad]=useState<Player[]>(INITIAL_SQUAD);
  const[market,setMarket]=useState<Player[]>([
    // ── PEMAIN INDONESIA ABROAD ──────────────────────────────
    {...mkP(201,"Marselino Ferdinan","MF","Gel. Serang",83,11.0,"Indonesia",false,22),club:"Oxford Utd (Inggris)"},
    {...mkP(202,"Jay Idzes","DF","Bek Tengah",82,10.5,"Indonesia",false,23),club:"Sassuolo (Italia)"},
    {...mkP(203,"Kevin Diks","DF","Bek Kanan",81,9.8,"Indonesia",false,28),club:"B.Mönchengladbach (Jerman)"},
    {...mkP(204,"Ivar Jenner","MF","Gel. Tengah",80,8.5,"Indonesia",false,22),club:"Utrecht (Belanda)"},
    {...mkP(205,"Justin Hubner","DF","Bek Tengah",79,7.5,"Indonesia",false,21),club:"Wisla Krakow (Polandia)"},
    {...mkP(206,"Ragnar Oratmangoen","FW","Sayap Kiri",78,6.8,"Indonesia",false,25),club:"Almere City (Belanda)"},
    {...mkP(207,"Sandy Walsh","DF","Bek Kanan",78,6.5,"Indonesia",false,29),club:"KV Mechelen (Belgia)"},
    {...mkP(208,"Shayne Pattynama","DF","Bek Kiri",77,5.8,"Indonesia",false,25),club:"Las Palmas B (Spanyol)"},
    {...mkP(209,"Nathan Tjoe-A-On","MF","Gel. Bertahan",77,5.5,"Indonesia",false,22),club:"Swansea City (Wales)"},
    {...mkP(210,"Maarten Paes","GK","Kiper",80,8.0,"Indonesia",false,27),club:"FC Dallas (USA)"},
    {...mkP(211,"Ernando Ari","GK","Kiper",77,5.2,"Indonesia",false,23),club:"Persebaya"},
    {...mkP(212,"Rizky Ridho","DF","Bek Tengah",84,10.5,"Indonesia",false,24),club:"Persija Jakarta"},
    // ── LIGA 1 TOP PLAYERS ───────────────────────────────────
    {...mkP(101,"Jordi Amat","DF","Bek Tengah",83,9.8,"Spanyol",false,32),club:"Persija Jakarta"},
    {...mkP(102,"Jean Mota","MF","Gel. Tengah",81,7.5,"Brasil",false,30),club:"Persija Jakarta"},
    {...mkP(103,"Diego Campos","FW","Sayap Kiri",83,9.0,"Kosta Rika",false,30),club:"Bali United"},
    {...mkP(104,"Teppei Yachida","MF","Gel. Serang",83,9.2,"Jepang",false,29),club:"Bali United"},
    {...mkP(105,"Rafael Struick","FW","Sayap Kanan",81,8.5,"Indonesia",false,22),club:"Dewa United"},
    {...mkP(106,"Mariano Peralta","FW","Depan Tengah",83,9.5,"Argentina",false,28),club:"Borneo FC"},
    {...mkP(107,"Matias Mier","MF","Gel. Serang",80,6.8,"Kolombia",false,30),club:"Bhayangkara"},
    {...mkP(108,"Francisco Rivera","MF","Gel. Serang",80,6.5,"Meksiko",false,27),club:"Persebaya"},
    {...mkP(109,"Moussa Sidibé","FW","Sayap Kanan",79,6.2,"Guinea",false,27),club:"Persis Solo"},
    {...mkP(110,"Nadeo Argawinata","GK","Kiper",80,7.0,"Indonesia",false,28),club:"Borneo FC"},
    {...mkP(111,"Thijmen Goppel","FW","Sayap Kanan",83,9.1,"Indonesia",false,24),club:"Bali United"},
    {...mkP(112,"Juan Felipe Villa","MF","Gel. Serang",81,7.2,"Kolombia",false,27),club:"Borneo FC"},
    {...mkP(113,"Adrian Luna","FW","Sayap Kiri",79,6.0,"Uruguay",false,30),club:"Persik Kediri"},
    {...mkP(114,"Jordy Wehrmann","MF","Gel. Bertahan",79,6.5,"Belanda",false,30),club:"Madura United"},
    {...mkP(115,"Dusan Lagator","DF","Bek Tengah",80,7.8,"Montenegro",false,28),club:"PSM Makassar"},
    {...mkP(116,"Kei Hirose","MF","Gel. Tengah",80,7.0,"Jepang",false,27),club:"Borneo FC"},
    // ── LIGA ASEAN ───────────────────────────────────────────
    {...mkP(301,"Chanathip Songkrasin","MF","Gel. Serang",84,12.0,"Thailand",false,31),club:"Buriram United (Thailand)"},
    {...mkP(302,"Supachok Sarachat","FW","Sayap Kiri",82,9.5,"Thailand",false,25),club:"Buriram United (Thailand)"},
    {...mkP(303,"Sarach Yooyen","MF","Gel. Tengah",79,6.5,"Thailand",false,32),club:"Muangthong Utd (Thailand)"},
    {...mkP(304,"Mohamad Faris Ramli","FW","Depan Tengah",78,6.0,"Malaysia",false,26),club:"Johor Darul Takzim (Malaysia)"},
    {...mkP(305,"Dominic Tan","DF","Bek Tengah",76,4.8,"Malaysia",false,27),club:"Johor Darul Takzim (Malaysia)"},
    {...mkP(306,"Nguyen Quang Hai","MF","Gel. Serang",81,9.0,"Vietnam",false,27),club:"Cong An Ha Noi (Vietnam)"},
    {...mkP(307,"Nguyen Tien Linh","FW","Depan Tengah",79,6.5,"Vietnam",false,27),club:"Becamex Binh Duong (Vietnam)"},
    {...mkP(308,"Daisuke Saito","FW","Sayap Kanan",79,6.8,"Jepang",false,28),club:"Lion City Sailors (Singapura)"},
    {...mkP(309,"Kim Shin-wook","FW","Depan Tengah",80,7.5,"Korea Selatan",false,36),club:"Jeonbuk (Korea)"},
    {...mkP(310,"Ilhan Fandi","FW","Sayap Kiri",76,5.0,"Singapura",false,24),club:"Lion City Sailors (Singapura)"},
    {...mkP(311,"Stefano Lilipaly","MF","Gel. Serang",77,5.5,"Indonesia",false,34),club:"Free Agent"},
    {...mkP(312,"Lerby Eliandry","FW","Depan Tengah",77,5.2,"Indonesia",false,33),club:"Borneo FC"},
  ]);

  const[budget,setBudget]=useState(30);
  const[week,setWeek]=useState(0);
  const[points,setPoints]=useState(0);
  const[morale,setMorale]=useState(75);
  const[transferOffer,setTransferOffer]=useState<{player:Player;fromClub:string;offerPrice:number}|null>(null);
  const[formation,setFormation]=useState<Formation>('4-4-2');
  const[tactic,setTactic]=useState<'Menyerang'|'Seimbang'|'Bertahan'>('Seimbang');
  const[intensity,setIntensity]=useState<'Lembut'|'Sedang'|'Kasar'>('Sedang');
  const[soundOn,setSoundOn]=useState(true);
  const[showConfetti,setShowConfetti]=useState(false);
  const[matchHistory,setMatchHistory]=useState<{opp:string;res:string;score:string}[]>([]);
  const[streak,setStreak]=useState(0);// positive=win streak, negative=loss streak
  const[coachAdviceLeft,setCoachAdviceLeft]=useState(2);// resets each matchweek
  const[showCoachAdvice,setShowCoachAdvice]=useState(false);
  const[matchSummary,setMatchSummary]=useState<{
    playerRatings:{id:number;name:string;pos:string;rating:number;goals:number;assists:number;carded:boolean}[];
    motm:string;result:'W'|'D'|'L';ps:number;os:number;oppName:string;
  }|null>(null);
  const[matchweekResults,setMatchweekResults]=useState<{home:string;away:string;hs:number;as:number}[]|null>(null);
  const[standings,setStandings]=useState<Standing[]>(INITIAL_STANDINGS);
  const[weather,setWeather]=useState(WEATHER[0]);
  const[marketFilter,setMarketFilter]=useState('ALL');
  const[buyConfirm,setBuyConfirm]=useState<Player|null>(null);
  const[sellTarget,setSellTarget]=useState<Player|null>(null);
  const[notification,setNotification]=useState<{msg:string;type:'good'|'bad'|'neutral'}|null>(null);
  const[weeklyEvent,setWeeklyEvent]=useState<{title:string;desc:string;type:'good'|'bad'|'neutral'}|null>(null);
  // swapMode is now internal to FormationPitch

  // Match state
  const[matchLogs,setMatchLogs]=useState<MatchLog[]>([]);
  const[score,setScore]=useState({p:0,o:0});
  const[matchMin,setMatchMin]=useState(0);
  const[isRunning,setIsRunning]=useState(false);
  const[isPaused,setIsPaused]=useState(false);
  const[speed,setSpeed]=useState(2);
  const[subsLeft,setSubsLeft]=useState(5);
  const[matchSquad,setMatchSquad]=useState<Player[]>([]);
  const[goalToast,setGoalToast]=useState<{scorer:string;assist:string|null;minute:number;isP:boolean}|null>(null);
  const[penaltyEvent,setPenaltyEvent]=useState<{isP:boolean;taker:string;minute:number}|null>(null);
  const[showTacticPanel,setShowTacticPanel]=useState(false);
  const[showSubPanel,setShowSubPanel]=useState(false);
  const[subSelectOut,setSubSelectOut]=useState<Player|null>(null);
  const[liveStats,setLiveStats]=useState({possession:50,shotsP:0,shotsO:0,yellowsP:0});
  const[matchFormation,setMatchFormation]=useState<Formation>('4-4-2');
  const[matchTactic,setMatchTactic]=useState<'Menyerang'|'Seimbang'|'Bertahan'>('Seimbang');
  const[matchIntensity,setMatchIntensity]=useState<'Lembut'|'Sedang'|'Kasar'>('Sedang');
  // In-match expelled players (red card / double yellow)
  const[expelledIds,setExpelledIds]=useState<Set<number>>(new Set());
  // Active decision
  const[activeDecision,setActiveDecision]=useState<MatchDecision|null>(null);
  const[decisionUsed,setDecisionUsed]=useState<Set<number>>(new Set());

  const intervalRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const stateRef=useRef({pScore:0,oScore:0,halfDone:false,min:0,expelled:new Set<number>()});
  const logsRef=useRef<HTMLDivElement>(null);
  const{playGoal,playWhistle,playClick,playWin,playCrowd}=useSound();

  // Derived
  const starters=squad.filter(p=>p.starter&&!p.injured);
  const bench=squad.filter(p=>!p.starter);
  // OVR = rata-rata rating starter (murni, tidak dikali form/stamina)
  // form/stamina hanya berpengaruh di match engine, bukan tampilan
  const teamOvr=Math.round(starters.reduce((a,p)=>a+p.rating,0)/Math.max(1,starters.length));
  // Squad OVR = all 11 starters average (untuk display lengkap)
  const squadOvrFull=squad.length>0?Math.round(squad.filter(p=>p.starter).reduce((a,p)=>a+p.rating,0)/Math.max(1,squad.filter(p=>p.starter).length)):0;
  const isValid=starters.length===11&&starters.filter(p=>p.pos==='GK').length===1;
  const opp=OPPONENTS[Math.min(week,OPPONENTS.length-1)];
  const sortedStandings=[...standings].sort((a,b)=>{if(b.points!==a.points)return b.points-a.points;const gB=b.gf-b.ga,gA=a.gf-a.ga;if(gB!==gA)return gB-gA;return b.gf-a.gf;});
  const topScorers=[...squad].filter(p=>p.goals>0).sort((a,b)=>b.goals-a.goals);
  const topAssists=[...squad].filter(p=>p.assists>0).sort((a,b)=>b.assists-a.assists);
  const filteredMarket=marketFilter==='ALL'?market:market.filter(p=>p.pos===marketFilter);

  useEffect(()=>{logsRef.current?.scrollIntoView({behavior:'smooth'});},[matchLogs]);
  useEffect(()=>()=>{if(intervalRef.current)clearInterval(intervalRef.current);},[]);

  useEffect(()=>{
    if(phase==='game'){localStorage.setItem('pm26v4',JSON.stringify({squad,budget,week,points,morale,matchHistory,formation,standings,managerName,managerRegion,phase}));}
  },[squad,budget,week,points,morale,matchHistory,formation,standings,managerName,managerRegion,phase]);
  useEffect(()=>{
    try{const s=localStorage.getItem('pm26v4');if(s){const d=JSON.parse(s);if(d.phase==='game'){setSquad(d.squad);setBudget(d.budget);setWeek(d.week);setPoints(d.points);setMorale(d.morale);setMatchHistory(d.matchHistory||[]);setFormation(d.formation||'4-4-2');setStandings(d.standings||INITIAL_STANDINGS);setManagerName(d.managerName||'');setManagerRegion(d.managerRegion||'');setPhase('game');}}}catch{}
  },[]);

  const notify=useCallback((msg:string,type:'good'|'bad'|'neutral'='neutral')=>{setNotification({msg,type});setTimeout(()=>setNotification(null),3000);},[]);
  const nav=(s:Screen)=>{if(soundOn)playClick();setScreen(s);};
  const posColor=(pos:string)=>pos==='GK'?'text-amber-400':pos==='DF'?'text-blue-400':pos==='MF'?'text-emerald-400':'text-red-400';
  const posBg=(pos:string)=>pos==='GK'?'bg-amber-500/20':pos==='DF'?'bg-blue-500/20':pos==='MF'?'bg-emerald-500/20':'bg-red-500/20';

  const toggleStarter=(p:Player)=>{
    if(p.injured||p.redCard||p.suspended)return;
    if(soundOn)playClick();
    setSquad(sq=>sq.map(x=>{
      if(x.id!==p.id)return x;
      if(!x.starter&&starters.length>=11)return x;
      return{...x,starter:!x.starter,unhappy:!x.starter?0:x.unhappy};
    }));
  };

  // swap is now handled inside FormationPitch via onSquadChange

  const smartFill=()=>{
    if(soundOn)playClick();
    const score=(p:Player)=>p.rating*0.5+(p.form/100)*25+(p.stamina/100)*25;
    const sq=squad.map(p=>({...p,starter:false}));
    (Object.entries(FORMATIONS[formation].pos)as[string,number][]).forEach(([pos,cnt])=>{
      sq.filter(p=>p.pos===pos&&!p.injured&&!p.redCard&&!p.suspended).sort((a,b)=>score(b)-score(a)).slice(0,cnt).forEach(p=>{const i=sq.findIndex(x=>x.id===p.id);if(i>=0)sq[i].starter=true;});
    });
    setSquad(sq);
    notify('✅ Lineup dioptimalkan form & stamina!','good');
  };

  const autoFill=()=>{
    if(soundOn)playClick();
    const sq=squad.map(p=>({...p,starter:false}));
    (Object.entries(FORMATIONS[formation].pos)as[string,number][]).forEach(([pos,cnt])=>{
      sq.filter(p=>p.pos===pos&&!p.injured&&!p.redCard&&!p.suspended).sort((a,b)=>b.rating-a.rating).slice(0,cnt).forEach(p=>{const i=sq.findIndex(x=>x.id===p.id);if(i>=0)sq[i].starter=true;});
    });
    setSquad(sq);
  };

  const confirmBuy=(p:Player)=>setBuyConfirm(p);
  const executeBuy=()=>{
    if(!buyConfirm||budget<buyConfirm.price)return;
    if(soundOn)playClick();
    setBudget(b=>+(b-buyConfirm.price).toFixed(1));
    setSquad(sq=>[...sq,{...buyConfirm,starter:false,club:'Persib Bandung'}]);
    setMarket(m=>m.filter(x=>x.id!==buyConfirm.id));
    notify(`✅ ${buyConfirm.name} bergabung!`,'good');
    setBuyConfirm(null);
  };

  const executeSell=(reason:string)=>{
    if(!sellTarget)return;
    if(squad.length<=14){notify('⚠️ Skuad minimal 14 pemain!','bad');setSellTarget(null);return;}
    if(soundOn)playClick();
    const sp=+(sellTarget.price*0.8).toFixed(1);
    setBudget(b=>+(b+sp).toFixed(1));
    setSquad(sq=>sq.filter(x=>x.id!==sellTarget.id));
    setMarket(m=>[...m,{...sellTarget,club:'Free Agent'}]);
    notify(`💸 ${sellTarget.name} dijual +${sp}M (${reason})`,'neutral');
    setSellTarget(null);
  };

  // ── SIMULTANEOUS MATCHWEEK: all 17 other teams play ──────
  const simOtherMatches=useCallback(()=>{
    setStandings(prev=>{
      const upd=[...prev];
      const others=upd.filter(t=>t.name!=='Persib Bandung');
      // Pair them up: 16 teams = 8 matches, 1 team gets bye
      const shuffled=[...others].sort(()=>Math.random()-0.5);
      for(let i=0;i<Math.floor(shuffled.length/2);i++){
        const a=shuffled[i*2], b=shuffled[i*2+1];
        const ia=upd.findIndex(t=>t.name===a.name);
        const ib=upd.findIndex(t=>t.name===b.name);
        // Score weighted by their OVR (from OPPONENTS data)
        const oppA=OPPONENTS.find(o=>o.name===a.name);
        const oppB=OPPONENTS.find(o=>o.name===b.name);
        const strA=(oppA?.ovr??72)+(Math.random()*8-4);// ±4 fluctuation per matchweek
        const strB=(oppB?.ovr??72)+(Math.random()*8-4);
        // Goals: 0-4 range, stronger team scores more
        const goalsA=Math.floor(Math.max(0,Math.random()*3+(strA>strB?0.5:-0.5)));
        const goalsB=Math.floor(Math.max(0,Math.random()*3+(strB>strA?0.5:-0.5)));
        const wA=goalsA>goalsB?1:0, wB=goalsB>goalsA?1:0, d=goalsA===goalsB?1:0;
        upd[ia]={...upd[ia],played:upd[ia].played+1,won:upd[ia].won+wA,draw:upd[ia].draw+d,lost:upd[ia].lost+(wB?1:0),gf:upd[ia].gf+goalsA,ga:upd[ia].ga+goalsB,points:upd[ia].points+(wA?3:d?1:0)};
        upd[ib]={...upd[ib],played:upd[ib].played+1,won:upd[ib].won+wB,draw:upd[ib].draw+d,lost:upd[ib].lost+(wA?1:0),gf:upd[ib].gf+goalsB,ga:upd[ib].ga+goalsA,points:upd[ib].points+(wB?3:d?1:0)};
      }
      return upd;
    });
  },[]);

  // ─── MATCH ENGINE ────────────────────────────────────────────
  // ── LIVE MATCH REFS — always read latest values without closure ──
  const liveMatchRef=useRef({
    tactic:'Seimbang' as 'Menyerang'|'Seimbang'|'Bertahan',
    intensity:'Sedang' as 'Lembut'|'Sedang'|'Kasar',
    formation:'4-4-2' as Formation,
    starters:[] as Player[],
    morale:75,
  });

  const runInterval=useCallback((curOpp:Opponent,initFm:Formation,initTac:string,initInt:string,initMorale:number,curWeather:typeof WEATHER[0],initStarters:Player[])=>{
    if(intervalRef.current)clearInterval(intervalRef.current);
    liveMatchRef.current={tactic:initTac as 'Menyerang'|'Seimbang'|'Bertahan',intensity:initInt as 'Lembut'|'Sedang'|'Kasar',formation:initFm,starters:initStarters,morale:initMorale};
    intervalRef.current=setInterval(()=>{
      stateRef.current.min+=1;
      const min=stateRef.current.min;
      setMatchMin(min);

      // Always read LIVE values from ref — reflects latest tactic/sub/intensity changes
      const curFm=liveMatchRef.current.formation;
      const curTac=liveMatchRef.current.tactic;
      const curInt=liveMatchRef.current.intensity;
      const curMorale=liveMatchRef.current.morale;
      const curStarters=liveMatchRef.current.starters.length>0?liveMatchRef.current.starters:initStarters;
      const activeStarters=curStarters.filter(p=>!stateRef.current.expelled.has(p.id));
      const activeCount=activeStarters.length;

      if(min===45&&!stateRef.current.halfDone){
        stateRef.current.halfDone=true;
        setMatchLogs(prev=>[...prev,{text:`— TURUN MINUM — PERSIB ${stateRef.current.pScore} - ${stateRef.current.oScore} ${curOpp.name}`,type:'halftime',minute:45}]);
        return;
      }
      if(min>=90){if(intervalRef.current)clearInterval(intervalRef.current);finishMatch(stateRef.current.pScore,stateRef.current.oScore,curOpp);return;}

      const decisionCandidate=DECISIONS.filter((_,di)=>!decisionUsed.has(di));
      if(decisionCandidate.length>0&&Math.random()>0.988){
        const di=Math.floor(Math.random()*decisionCandidate.length);
        const decision={...decisionCandidate[di],minute:min};
        setActiveDecision(decision);
        setDecisionUsed(s=>new Set([...s,DECISIONS.indexOf(decisionCandidate[di])]));
        if(intervalRef.current)clearInterval(intervalRef.current);
        setIsPaused(true);
        return;
      }

      const avgRating=activeStarters.reduce((a,p)=>{
        const fit=Math.round((p.form/100*0.5+p.stamina/100*0.5)*100);
        const fatiguePenalty=fit<55?0.15:fit<70?0.08:fit<85?0.03:0;
        return a+p.rating*(p.form/100)*(p.stamina/100)*(1-fatiguePenalty);
      },0)/Math.max(1,activeStarters.length);

      const manPenalty=(11-activeCount)*3;
      // Significantly impactful bonuses so changes are felt
      const tacBonusAtk=curTac==='Menyerang'?7:curTac==='Bertahan'?-4:0;
      const tacBonusDef=curTac==='Bertahan'?7:curTac==='Menyerang'?-4:0;
      const intAtkBonus=curInt==='Kasar'?5:curInt==='Lembut'?-3:0;
      const intDefBonus=curInt==='Lembut'?4:curInt==='Kasar'?-3:0;
      const intFoulMult=curInt==='Kasar'?2.5:curInt==='Lembut'?0.4:1;
      const homeAdv=curOpp.isAway?-2:3;
      const moraleF=(curMorale-50)/25;
      const derbyF=curOpp.isDerby?2:0;
      const weatherF=(curWeather.eff.sta+curWeather.eff.pas)/2;
      const fmBonus=FORMATIONS[curFm].bonus;
      let fmMatchup=0;
      if((FORMATIONS[curFm].strong as readonly string[]).includes(curOpp.formation))fmMatchup=7;
      if((FORMATIONS[curFm].weak as readonly string[]).includes(curOpp.formation))fmMatchup=-7;

      const myAtkStr=avgRating+tacBonusAtk+homeAdv+moraleF+derbyF+fmBonus.atk+fmMatchup+weatherF+intAtkBonus-manPenalty;
      const myDefStr=avgRating+tacBonusDef+intDefBonus+fmBonus.def+homeAdv*0.5-manPenalty;
      const oppAtkStr=curOpp.atk+(curOpp.isAway?2:-1)+(curOpp.isDerby?3:0);
      const oppDefStr=curOpp.def+(curOpp.isAway?1:2);

      const pGoal=Math.min(0.038,Math.max(0.005,0.018+(myAtkStr-oppDefStr)*0.001));
      const oGoal=Math.min(0.035,Math.max(0.005,0.016+(oppAtkStr-myDefStr)*0.001));
      const foulProb=0.008*intFoulMult;
      const injuryProb=curInt==='Kasar'?0.003:curInt==='Sedang'?0.001:0.0003;
      const penaltyProb=0.004*(curInt==='Kasar'?1.5:1);
      const r1=Math.random(),r2=Math.random(),r3=Math.random(),r4=Math.random(),r5=Math.random();

      if(r5<penaltyProb){
        const isP=myAtkStr>oppDefStr?Math.random()>0.35:Math.random()>0.6;
        const fwMf=activeStarters.filter(p=>['FW','MF'].includes(p.pos));
        const taker=isP?(fwMf.length?fwMf[Math.floor(Math.random()*fwMf.length)].name:'?'):curOpp.scorers[Math.floor(Math.random()*curOpp.scorers.length)];
        setMatchLogs(prev=>[...prev,{text:`🟡 ${min}' PENALTI! ${isP?'Untuk PERSIB':'Untuk '+curOpp.name}! ${taker} siap mengeksekusi...`,type:'card',minute:min}]);
        setPenaltyEvent({isP,taker,minute:min});
        if(intervalRef.current)clearInterval(intervalRef.current);
        setIsPaused(true);
        return;
      }
      if(r1<pGoal){
        const fwMf=activeStarters.filter(p=>['FW','MF'].includes(p.pos));
        const scorer=fwMf.length?fwMf[Math.floor(Math.random()*fwMf.length)].name:activeStarters[0]?.name||'?';
        const assList=activeStarters.filter(p=>p.name!==scorer&&['MF','FW','DF'].includes(p.pos));
        const assist=assList.length>0&&Math.random()>0.35?assList[Math.floor(Math.random()*assList.length)].name:null;
        stateRef.current.pScore++;
        setScore({p:stateRef.current.pScore,o:stateRef.current.oScore});
        setSquad(sq=>sq.map(p=>p.name===scorer?{...p,goals:p.goals+1}:p.name===assist?{...p,assists:p.assists+1}:p));
        setMatchLogs(prev=>[...prev,{text:`⚽ ${min}' GOL PERSIB! ${scorer}${assist?` (assist: ${assist})`:''} — ${GOAL_P[Math.floor(Math.random()*GOAL_P.length)]}`,type:'goal-p',minute:min}]);
        setGoalToast({scorer,assist,minute:min,isP:true});
        setLiveStats(prev=>({...prev,shotsP:prev.shotsP+1}));
        if(soundOn)playGoal();
        setShowConfetti(true);setTimeout(()=>setShowConfetti(false),2500);
      } else if(r2<oGoal){
        const scorer=curOpp.scorers[Math.floor(Math.random()*curOpp.scorers.length)];
        stateRef.current.oScore++;
        setScore({p:stateRef.current.pScore,o:stateRef.current.oScore});
        setMatchLogs(prev=>[...prev,{text:`😔 ${min}' GOL ${curOpp.name.toUpperCase()}! ${scorer} — ${GOAL_O[Math.floor(Math.random()*GOAL_O.length)]}`,type:'goal-o',minute:min}]);
        setGoalToast({scorer,assist:null,minute:min,isP:false});
        setLiveStats(prev=>({...prev,shotsO:(prev.shotsO||0)+1}));
        if(soundOn)playCrowd();
      } else if(r3<foulProb&&activeStarters.length>0){
        const pl=activeStarters[Math.floor(Math.random()*activeStarters.length)];
        const curYellows=(pl.matchYellows||0)+1;
        if(curYellows>=2){
          setMatchSquad(sq=>sq.map(p=>p.id===pl.id?{...p,matchYellows:2,redCard:true,starter:false}:p));
          stateRef.current.expelled.add(pl.id);setExpelledIds(s=>new Set([...s,pl.id]));
          setMatchLogs(prev=>[...prev,{text:`🟨🟥 ${min}' KARTU MERAH! ${pl.name} — Persib main ${activeCount-1} orang!`,type:'red',minute:min}]);
          setSquad(sq=>sq.map(p=>p.id===pl.id?{...p,yellowCards:p.yellowCards+1,redCard:true}:p));
        } else {
          setMatchSquad(sq=>sq.map(p=>p.id===pl.id?{...p,matchYellows:curYellows}:p));
          setMatchLogs(prev=>[...prev,{text:`🟨 ${min}' KARTU KUNING — ${pl.name} (${curYellows}/2)`,type:'card',minute:min}]);
          setSquad(sq=>sq.map(p=>p.id===pl.id?{...p,yellowCards:p.yellowCards+1,matchYellows:curYellows}:p));
          setLiveStats(prev=>({...prev,yellowsP:prev.yellowsP+1}));
        }
      } else if(curInt==='Kasar'&&r3<foulProb*1.5&&r3>foulProb&&activeStarters.length>0){
        const pl=activeStarters[Math.floor(Math.random()*activeStarters.length)];
        stateRef.current.expelled.add(pl.id);setExpelledIds(s=>new Set([...s,pl.id]));
        setMatchSquad(sq=>sq.map(p=>p.id===pl.id?{...p,redCard:true,starter:false}:p));
        setSquad(sq=>sq.map(p=>p.id===pl.id?{...p,redCard:true}:p));
        setMatchLogs(prev=>[...prev,{text:`🟥 ${min}' KARTU MERAH LANGSUNG! ${pl.name} — tackle brutal!`,type:'red',minute:min}]);
      } else if(r4<injuryProb&&activeStarters.length>0){
        const pl=activeStarters[Math.floor(Math.random()*activeStarters.length)];
        const weeks=curInt==='Kasar'?Math.ceil(Math.random()*4)+1:Math.ceil(Math.random()*2);
        setMatchSquad(sq=>sq.map(p=>p.id===pl.id?{...p,injured:true,starter:false}:p));
        setSquad(sq=>sq.map(p=>p.id===pl.id?{...p,injured:true,injuryWeeks:weeks,starter:false}:p));
        setMatchLogs(prev=>[...prev,{text:`🚑 ${min}' CEDERA! ${pl.name} harus keluar! Absen ${weeks} pekan.`,type:'injury',minute:min}]);
      } else if(r3>0.88&&r3<0.92){
        const isP=Math.random()>0.45;
        setMatchLogs(prev=>[...prev,{text:`${min}' ${COMM_CHANCE[Math.floor(Math.random()*COMM_CHANCE.length)]}`,type:'chance',minute:min}]);
        if(isP)setLiveStats(prev=>({...prev,shotsP:prev.shotsP+1}));
      } else if(r3>0.95&&r3<0.97){
        setMatchLogs(prev=>[...prev,{text:`${min}' ${COMM_SAVE[Math.floor(Math.random()*COMM_SAVE.length)]}`,type:'info',minute:min}]);
      } else if(r3>0.80&&r3<0.83){
        setMatchLogs(prev=>[...prev,{text:`${min}' ${COMM_POSS[Math.floor(Math.random()*COMM_POSS.length)]}`,type:'info',minute:min}]);
      }
      // Atmosphere sounds
      if(min===80&&stateRef.current.pScore>stateRef.current.oScore&&soundOn)playCrowd();
      if(min===88&&stateRef.current.pScore===stateRef.current.oScore&&soundOn)playCrowd();

      const possDiff=(myAtkStr-oppAtkStr)/30;
      setLiveStats(prev=>({...prev,possession:Math.round(50+possDiff*10+Math.random()*6-3)}));
    },Math.round(1000/speed));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[speed,soundOn,playGoal,playCrowd,decisionUsed]);

  // Update liveMatchRef whenever match state changes — interval reads this every tick
  useEffect(()=>{
    if(isRunning){
      liveMatchRef.current.tactic=matchTactic;
      liveMatchRef.current.intensity=matchIntensity;
      liveMatchRef.current.formation=matchFormation;
      liveMatchRef.current.morale=morale;
      if(matchSquad.length>0)liveMatchRef.current.starters=matchSquad.filter(p=>p.starter&&!p.redCard&&!p.injured);
    }
  },[matchTactic,matchIntensity,matchFormation,matchSquad,morale,isRunning]);

  useEffect(()=>{
    if(isRunning&&!isPaused)runInterval(opp,matchFormation,matchTactic,matchIntensity,morale,weather,matchSquad.length?matchSquad.filter(p=>p.starter&&!p.redCard&&!p.injured):starters);
    else if(isPaused&&intervalRef.current)clearInterval(intervalRef.current);
    return()=>{if(intervalRef.current)clearInterval(intervalRef.current);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[speed,isPaused,isRunning]);

  // Handle decision choice
  // ── PENALTY HANDLER ──────────────────────────────────────
  const handlePenalty=(aim:'left'|'center'|'right')=>{
    if(!penaltyEvent)return;
    const{isP,taker,minute}=penaltyEvent;
    setPenaltyEvent(null);
    setIsPaused(false);
    // OVR-based success rate: higher team rating = higher chance
    const teamRating=starters.reduce((a,p)=>a+p.rating,0)/Math.max(1,starters.length);
    const baseChance=isP?(teamRating-60)/40*0.3+0.55:0.72;// 55-85% for Persib, 72% for opp
    const aimBonus=aim==='left'||aim==='right'?0.08:-0.05;// corners harder but better
    const scored=Math.random()<(baseChance+aimBonus);
    if(isP){
      if(scored){
        stateRef.current.pScore++;
        setScore({p:stateRef.current.pScore,o:stateRef.current.oScore});
        setSquad(sq=>sq.map(p=>p.name===taker?{...p,goals:p.goals+1}:p));
        setMatchLogs(prev=>[...prev,{text:`⚽ ${minute}' GOL PENALTI! ${taker} eksekusi ${aim}! Brilian!`,type:'goal-p',minute}]);
        setGoalToast({scorer:taker,assist:null,minute,isP:true});
        if(soundOn)playGoal();
        setShowConfetti(true);setTimeout(()=>setShowConfetti(false),2500);
      } else {
        setMatchLogs(prev=>[...prev,{text:`❌ ${minute}' PENALTI GAGAL! ${taker} tembak ${aim} — kiper menyelamatkan!`,type:'chance',minute}]);
      }
    } else {
      // Opponent penalty — random based on opp strength
      const oppScored=Math.random()<0.72;
      if(oppScored){
        stateRef.current.oScore++;
        setScore({p:stateRef.current.pScore,o:stateRef.current.oScore});
        setMatchLogs(prev=>[...prev,{text:`😔 ${minute}' PENALTI MASUK! ${taker} tidak bisa dihentikan!`,type:'goal-o',minute}]);
        setGoalToast({scorer:taker,assist:null,minute,isP:false});
        if(soundOn)playCrowd();
      } else {
        setMatchLogs(prev=>[...prev,{text:`💪 ${minute}' KIPER MENYELAMATKAN PENALTI LAWAN! Heroik!`,type:'info',minute}]);
        if(soundOn)playCrowd();
      }
    }
  };

  // ── TRANSFER OFFER HANDLER ───────────────────────────────
  const handleTransferOffer=(accept:boolean)=>{
    if(!transferOffer)return;
    if(accept){
      setBudget(b=>+(b+transferOffer.offerPrice).toFixed(1));
      setSquad(sq=>sq.filter(p=>p.id!==transferOffer.player.id));
      setMarket(m=>[...m,{...transferOffer.player,starter:false,club:transferOffer.fromClub}]);
      notify(`💰 ${transferOffer.player.name} dijual ke ${transferOffer.fromClub} +${transferOffer.offerPrice}M!`,'good');
    } else {
      notify(`🚫 Tawaran dari ${transferOffer.fromClub} ditolak`,'neutral');
    }
    setTransferOffer(null);
  };

  const handleDecision=(effect:string)=>{
    if(!activeDecision)return;
    setActiveDecision(null);
    setIsPaused(false);
    const min=stateRef.current.min;
    switch(effect){
      case'goal':{
        if(Math.random()>0.35){
          const fwMf=starters.filter(p=>['FW','MF'].includes(p.pos));
          const scorer=fwMf[Math.floor(Math.random()*fwMf.length)]?.name||'?';
          stateRef.current.pScore++;
          setScore({p:stateRef.current.pScore,o:stateRef.current.oScore});
          setMatchLogs(prev=>[...prev,{text:`⚽ ${min}' GOL! Keputusan manager brilian! ${scorer}!`,type:'goal-p',minute:min}]);
          setGoalToast({scorer,assist:null,minute:min,isP:true});
          if(soundOn)playGoal();
        } else {
          setMatchLogs(prev=>[...prev,{text:`${min}' Keputusan manager... sayang meleset!`,type:'chance',minute:min}]);
        }
        break;}
      case'miss':setMatchLogs(prev=>[...prev,{text:`${min}' Tendangan bebas lawan meleset! Strategi berhasil.`,type:'info',minute:min}]);break;
      case'card':{
        const pl=starters[Math.floor(Math.random()*starters.length)];
        if(pl){setMatchLogs(prev=>[...prev,{text:`🟨 ${min}' ${pl.name} dapat kartu kuning setelah protes!`,type:'card',minute:min}]);}
        break;}
      case'injury_risk':setMatchLogs(prev=>[...prev,{text:`${min}' Pemain terus bertahan meski kelelahan...`,type:'info',minute:min}]);break;
      case'morale_boost':{setMorale(m=>Math.min(100,m+5));setMatchLogs(prev=>[...prev,{text:`🤝 ${min}' Fair play Persib! Morale tim meningkat!`,type:'decision',minute:min}]);break;}
      default:setMatchLogs(prev=>[...prev,{text:`${min}' Manager memilih strategi aman.`,type:'info',minute:min}]);
    }
  };

  const startMatch=()=>{
    if(!isValid)return;
    if(soundOn)playWhistle();
    setMatchSquad([...squad]);
    setMatchFormation(formation);setMatchTactic(tactic);setMatchIntensity(intensity);
    setScore({p:0,o:0});setMatchMin(0);setSubsLeft(5);
    setShowSubPanel(false);setShowTacticPanel(false);setSubSelectOut(null);
    setLiveStats({possession:50,shotsP:0,shotsO:0,yellowsP:0});
    setExpelledIds(new Set());setActiveDecision(null);setDecisionUsed(new Set());setPenaltyEvent(null);
    stateRef.current={pScore:0,oScore:0,halfDone:false,min:0,expelled:new Set()};
    // Reset match yellows for this game
    setSquad(sq=>sq.map(p=>({...p,matchYellows:0})));
    const w=WEATHER[Math.floor(Math.random()*WEATHER.length)];
    setWeather(w);
    setMatchLogs([
      {text:`🏟️ KICK OFF! ${opp.isDerby?'⚡ DERBY! ':''}${opp.isAway?opp.stadium:'Gelora Bandung Lautan Api'}`,type:'info',minute:0},
      {text:`${formation} | ${tactic} | Intensitas: ${intensity} | ${w.name}`,type:'info',minute:0},
    ]);
    setIsRunning(true);setIsPaused(false);
    setScreen('match');
  };

  const finishMatch=useCallback((ps:number,os:number,curOpp:Opponent)=>{
    setIsRunning(false);
    if(soundOn)playWhistle();
    const pts=ps>os?3:ps===os?1:0;
    const res=pts===3?'MENANG! 🎉':pts===1?'SERI':'KALAH 😞';
    if(pts===3&&soundOn)playWin();
    setMatchLogs(prev=>[...prev,{text:`🏁 FULL TIME — PERSIB ${ps} - ${os} ${curOpp.name} | ${res}`,type:'fulltime',minute:90}]);
    if(pts===3){setShowConfetti(true);setTimeout(()=>setShowConfetti(false),4000);}
    setStandings(prev=>prev.map(t=>{
      if(t.name==='Persib Bandung')return{...t,played:t.played+1,won:t.won+(ps>os?1:0),draw:t.draw+(ps===os?1:0),lost:t.lost+(ps<os?1:0),gf:t.gf+ps,ga:t.ga+os,points:t.points+pts};
      if(t.name===curOpp.name)return{...t,played:t.played+1,won:t.won+(os>ps?1:0),draw:t.draw+(ps===os?1:0),lost:t.lost+(os<ps?1:0),gf:t.gf+os,ga:t.ga+ps,points:t.points+(os>ps?3:ps===os?1:0)};
      return t;
    }));
    setMatchHistory(prev=>[...prev,{opp:curOpp.name,res:pts===3?'M':pts===1?'S':'K',score:`${ps}-${os}`}]);
    // ── STREAK ──────────────────────────────────────────────
    setStreak(prev=>{
      if(pts===3)return prev>=0?prev+1:1;
      if(pts===0)return prev<=0?prev-1:-1;
      return 0;
    });
    // ── MATCH SUMMARY ────────────────────────────────────────
    const curSquadSnap=[...squad];
    const playersWithRatings=curSquadSnap.filter(p=>p.starter||p.matchesPlayed>0).slice(0,11).map(p=>{
      let r=6.0;
      if(p.goals>0)r+=p.goals*1.2;
      if(p.assists>0)r+=p.assists*0.8;
      if(p.yellowCards>0)r-=0.5;
      if(p.redCard)r-=2.0;
      if(p.injured)r-=1.0;
      r+=((p.form-70)/100)*2+(pts===3?0.5:pts===0?-0.5:0);
      r+=Math.random()*1.2-0.4;
      return{id:p.id,name:p.name,pos:p.pos,rating:Math.round(Math.min(10,Math.max(4,r))*10)/10,goals:p.goals,assists:p.assists,carded:p.yellowCards>0||p.redCard};
    }).sort((a,b)=>b.rating-a.rating);
    const motm=playersWithRatings[0]?.name||'?';
    setMatchSummary({playerRatings:playersWithRatings,motm,result:pts===3?'W':pts===1?'D':'L',ps,os,oppName:curOpp.name});
    // ── MATCHWEEK RESULTS ────────────────────────────────────
    const allTeams=OPPONENTS.map(o=>o.name);
    const shuffled=[...allTeams].sort(()=>Math.random()-0.5);
    const mwResults=[];
    for(let i=0;i<Math.floor(shuffled.length/2);i++){
      const h=shuffled[i*2],a=shuffled[i*2+1];
      const oH=OPPONENTS.find(o=>o.name===h),oA=OPPONENTS.find(o=>o.name===a);
      const sH=Math.floor(Math.max(0,Math.random()*3+((oH?.ovr??70)-(oA?.ovr??70))/20));
      const sA=Math.floor(Math.max(0,Math.random()*3-((oH?.ovr??70)-(oA?.ovr??70))/20));
      mwResults.push({home:h.replace(' Bandung','').replace(' Jakarta','').replace(' Makassar',''),away:a.replace(' Bandung','').replace(' Jakarta','').replace(' Makassar',''),hs:sH,as:sA});
    }
    setMatchweekResults(mwResults);
    // ── COACH ADVICE RESET ────────────────────────────────────
    setCoachAdviceLeft(2);
    setTimeout(()=>{
      const income=pts===3?(curOpp.isDerby?8:4):pts===1?2:1;
      setBudget(b=>+(b+income).toFixed(1));
      setPoints(p=>p+pts);
      setMorale(m=>Math.min(100,Math.max(0,m+(pts===3?10:pts===1?-2:-12))));
      setSquad(sq=>sq.map(p=>{
        const played=p.starter;
        // ── STAMINA RECOVERY: full reset between matchweeks ──
        // Players recover ~80-95% stamina between matches (realistic)
        const staminaRecovery=Math.min(100,p.stamina+(played?0:20)+(Math.random()*15+70));
        const newStamina=Math.min(100,Math.max(30,staminaRecovery));
        // ── FORM: based on result + individual performance ──
        const formBase=pts===3?8:pts===1?0:-5;
        const formRandom=Math.random()*10-5;
        const newForm=Math.min(100,Math.max(50,p.form+formBase+formRandom));
        // ── INJURY: count down weeks ──
        const newInjuryWeeks=p.injuryWeeks>0?p.injuryWeeks-1:0;
        const newInjured=newInjuryWeeks>0;
        // ── SUSPENSION: red card → miss next 1 match ──
        // If currently suspended, clear it (they've served it)
        // If red card was given in THIS match, set suspended for next
        const newSuspended=p.redCard&&!p.suspended;// red card → suspended next
        const newRedCard=false;// clear red card after match
        // ── YELLOW CARD ACCUMULATION: 5 yellows = 1 match ban ──
        const newSuspendedYellow=p.yellowCards>0&&p.yellowCards%5===0&&!p.suspended;
        const finalSuspended=p.suspended?false:(newSuspended||newSuspendedYellow);
        // ── PLAYER DEVELOPMENT ──
        // All players: good form → small rating gain; bad form → small loss
        // Young players (<23): bigger gain potential
        const devChance=Math.random();
        const isYoung=p.age<=23;
        const formGood=newForm>85;
        const formBad=newForm<60;
        let ratingDelta=0;
        if(played){
          if(formGood&&devChance>0.6) ratingDelta=isYoung?+(Math.random()*0.5).toFixed(1):+(Math.random()*0.2).toFixed(1);
          else if(formBad&&devChance>0.7) ratingDelta=-(Math.random()*0.3).toFixed(1) as unknown as number;
        }
        const newRating=Math.min(99,Math.max(55,+(p.rating+ratingDelta).toFixed(1)));
        return{
          ...p,
          rating:newRating,
          form:newForm,
          stamina:newStamina,
          unhappy:played?0:Math.min(5,p.unhappy+1),
          matchesPlayed:played?p.matchesPlayed+1:p.matchesPlayed,
          redCard:newRedCard,
          matchYellows:0,
          suspended:finalSuspended,
          injuryWeeks:newInjuryWeeks,
          injured:newInjured,
        };
      }));
      simOtherMatches();
      // ── DYNAMIC MARKET PRICES ────────────────────────────
      setMarket(m=>m.map(p=>{
        const scored=pts===3&&Math.random()>0.7;
        const priceChange=scored?+(Math.random()*0.5).toFixed(1):
          Math.random()>0.85?-(Math.random()*0.3).toFixed(1) as unknown as number:0;
        const newPrice=Math.max(0.5,+(p.price+priceChange).toFixed(1));
        return{...p,price:newPrice};
      }));
      // ── TRANSFER OFFER: clubs bid for your high-performing players ──
      // Triggered if: player has good form+rating, and random chance
      const eligibleForOffer=squad.filter(p=>p.rating>=78&&p.form>82&&p.matchesPlayed>0&&!p.injured);
      if(eligibleForOffer.length>0&&Math.random()>0.65&&week>=2){
        const target=eligibleForOffer[Math.floor(Math.random()*eligibleForOffer.length)];
        const bidderClubs=OPPONENTS.filter(o=>o.name!==curOpp.name);
        const bidder=bidderClubs[Math.floor(Math.random()*bidderClubs.length)];
        const premium=target.form>90?1.5:1.25;// High form = bigger offer
        const offerPrice=+(target.price*premium).toFixed(1);
        setTimeout(()=>setTransferOffer({player:target,fromClub:bidder.name,offerPrice}),1000);
      }
      // ── OPPONENT OVR FLUCTUATION ─────────────────────────
      // Opponents' OVR varies ±3 each week to simulate form/injuries
      // This affects standings simulation accuracy but keeps it fair
      const events=[
        {title:"Sponsor Tambahan!",desc:"Sponsorship baru masuk +4M.",type:'good'as const,effect:()=>setBudget(b=>+(b+4).toFixed(1))},
        {title:"Bonus Direksi",desc:"Direktur senang, bonus +3M!",type:'good'as const,effect:()=>setBudget(b=>+(b+3).toFixed(1))},
        {title:"Renovasi Fasilitas",desc:"Perbaikan fasilitas -2M.",type:'bad'as const,effect:()=>setBudget(b=>+(Math.max(0,b-2)).toFixed(1))},
        {title:"Media Positif!",desc:"Liputan bagus, morale +8.",type:'good'as const,effect:()=>setMorale(m=>Math.min(100,m+8))},
        {title:"Gejolak Internal",desc:"Rumor internal, morale -5.",type:'bad'as const,effect:()=>setMorale(m=>Math.max(0,m-5))},
        {title:"Sesi Latihan Intensif",desc:"Tim berlatih keras, stamina +10 semua.",type:'neutral'as const,effect:()=>setSquad(sq=>sq.map(p=>({...p,stamina:Math.min(100,p.stamina+10)})))},
      ];
      const ev=events[Math.floor(Math.random()*events.length)];
      ev.effect();
      setWeeklyEvent({title:ev.title,desc:ev.desc,type:ev.type});
      // ── STREAK EFFECT ──────────────────────────────────────
      setStreak(prev=>{
        if(prev>=3){setMorale(m=>Math.min(100,m+5));setSquad(sq=>sq.map(p=>({...p,form:Math.min(100,p.form+5)})));}
        if(prev<=-3){setMorale(m=>Math.max(0,m-5));}
        return prev;
      });
      // ── LOYALTY / CONTRACT — unhappy players demand transfer ──
      setSquad(sq=>{
        const updated=sq.map(p=>{
          if(p.unhappy>=4&&p.matchesPlayed<week*0.3&&!p.injured){
            // Player wants out — notify (using setTimeout to avoid render-during-render)
            setTimeout(()=>setWeeklyEvent({
              title:`😤 ${p.name} Minta Dijual!`,
              desc:`${p.name} tidak puas dengan waktu mainnya. Jual atau bujuk dengan bonus latihan.`,
              type:'bad'
            }),3500);
          }
          return p;
        });
        return updated;
      });
      if(week+1>=OPPONENTS.length||morale<=5){
        const finalPos=([...standings,{name:'Persib Bandung',played:0,won:0,draw:0,lost:0,gf:0,ga:0,points:points+pts,color:'#0047AB'}]).sort((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)).findIndex(t=>t.name==='Persib Bandung')+1;
        if(finalPos===1&&pts===3){setTimeout(()=>setScreen('champion-preview'),1500);}
        else{setTimeout(()=>setScreen('end'),1500);}
      } else {
        setWeek(w=>w+1);
        // Show matchweek results screen first, then home
        setTimeout(()=>setScreen('matchweek-results'),1500);
      }
    },2500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[soundOn,playWhistle,playWin,simOtherMatches,week,morale]);

  const makeSub=(out:Player,incoming:Player)=>{
    if(subsLeft<=0)return;
    if(soundOn)playClick();
    const newSq=matchSquad.map(p=>p.id===out.id?{...incoming,starter:true}:p.id===incoming.id?{...out,starter:false}:p);
    setMatchSquad(newSq);
    // Immediately update liveMatchRef so match engine uses new player next tick
    liveMatchRef.current.starters=newSq.filter(p=>p.starter&&!p.redCard&&!p.injured&&!stateRef.current.expelled.has(p.id));
    setSubsLeft(s=>s-1);setSubSelectOut(null);setShowSubPanel(false);
    setMatchLogs(prev=>[...prev,{text:`🔄 ${stateRef.current.min}' SUB: ⬆️${incoming.name} (${incoming.rating}) ⬇️${out.name} — perubahan langsung efektif!`,type:'sub',minute:stateRef.current.min}]);
  };

  // ── COACH ADVICE — rule-based, max 2x per gameweek ─────────
  const getCoachAdvice=useCallback(():string[]=>{
    const curOppData=OPPONENTS[Math.min(week,OPPONENTS.length-1)];
    const myOvr=starters.reduce((a,p)=>a+p.rating,0)/Math.max(1,starters.length);
    const diff=myOvr-curOppData.ovr;
    const ps=stateRef.current.pScore,os=stateRef.current.oScore;
    const min=stateRef.current.min;
    const isLosing=os>ps,isDrawing=ps===os,isWinning=ps>os;
    const tips:string[]=[];
    // Formation
    if(curOppData.formation==='3-5-2')tips.push(`📐 Lawan main 3-5-2. Formasi 4-3-3 sangat efektif membuka sisi lebar mereka.`);
    else if(curOppData.formation==='4-3-3')tips.push(`📐 Lawan main 4-3-3. Formasi 5-3-2 meredam winger mereka dengan efektif.`);
    else if(curOppData.formation==='4-4-2')tips.push(`📐 Lawan main 4-4-2. Formasi 4-3-3 bisa mendominasi lini tengah.`);
    else tips.push(`📐 Lawan main ${curOppData.formation}. ${curOppData.tacticalTip}`);
    // Skor & menit
    if(isLosing&&min>=60)tips.push(`🔥 Tertinggal menit ${min}! Ganti ke MENYERANG + KASAR. Masukkan striker cadangan.`);
    else if(isWinning&&min>=75)tips.push(`🛡️ Unggul menit ${min}. Switch ke BERTAHAN + LEMBUT untuk aman.`);
    else if(isDrawing&&min>=65)tips.push(`⚡ Imbang menit ${min}. Masukkan pemain segar di FW/MF untuk cari gol pemenang!`);
    else if(isLosing&&min<45)tips.push(`😤 Masih ada waktu! Naikkan intensitas dan coba ubah formasi untuk mengejutkan lawan.`);
    // OVR
    if(diff<-3)tips.push(`📊 OVR kita lebih rendah ${Math.abs(diff.toFixed(1))} dari lawan. Fokus counter-attack, jangan open play.`);
    else if(diff>5)tips.push(`💪 Kita lebih kuat! Pressing tinggi dan dominasi bola.`);
    // Kelelahan
    const tired=starters.filter(p=>p.stamina<60);
    if(tired.length>=3)tips.push(`😮‍💨 ${tired.length} pemain kelelahan (${tired[0]?.name} dll). Lakukan substitusi segera!`);
    // Cuaca
    if(weather.name==='Hujan Lebat')tips.push(`🌧️ Hujan lebat — kurangi umpan pendek, manfaatkan bola panjang dan set piece.`);
    // Danger player
    if(curOppData.dangerPlayers.length>0)tips.push(`⚠️ Awasi ${curOppData.dangerPlayers[0]}. Tempatkan bek terkuat untuk menjaganya.`);
    // Default
    if(tips.length<2)tips.push(`✅ Strategi saat ini sudah bagus. Pertahankan intensitas dan tunggu momen!`);
    return tips.slice(0,3);
  },[week,starters,weather,opp]);// eslint-disable-line

  const handleCoachAdvice=()=>{
    if(coachAdviceLeft<=0||!isRunning)return;
    if(soundOn)playClick();
    setCoachAdviceLeft(n=>n-1);
    setShowCoachAdvice(true);
    setIsPaused(true);
  };

  const resetGame=()=>{localStorage.removeItem('pm26v4');window.location.reload();};

  // ── INTRO ────────────────────────────────────────────────────
  if(phase==='intro')return(
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <TigerBg/>
      <motion.div initial={{opacity:0,y:40}}animate={{opacity:1,y:0}}transition={{duration:0.7,ease:[0.22,1,0.36,1]}}className="relative z-10 w-full max-w-sm mx-4">

        {/* Bojan Hodak cartoon */}
        <motion.div initial={{scale:0,rotate:-10}}animate={{scale:1,rotate:0}}transition={{delay:0.2,type:'spring',stiffness:150,damping:15}}
          className="flex justify-center mb-4">
          <div className="relative">
            <svg width="130" height="160" viewBox="0 0 130 160" xmlns="http://www.w3.org/2000/svg">
              {/* Body - buncit */}
              <ellipse cx="65" cy="118" rx="38" ry="32" fill="#2c5aa0"/>
              {/* Belly protrusion */}
              <ellipse cx="65" cy="125" rx="28" ry="22" fill="#1d4ed8"/>
              {/* Neck */}
              <rect x="57" y="88" width="16" height="14" rx="4" fill="#f5c5a3"/>
              {/* Head - bald & round */}
              <ellipse cx="65" cy="72" rx="28" ry="26" fill="#f5c5a3"/>
              {/* Bald shine */}
              <ellipse cx="58" cy="55" rx="8" ry="5" fill="rgba(255,255,255,0.35)" transform="rotate(-20,58,55)"/>
              {/* Ears */}
              <ellipse cx="37" cy="72" rx="5" ry="7" fill="#f0b090"/>
              <ellipse cx="93" cy="72" rx="5" ry="7" fill="#f0b090"/>
              <ellipse cx="37" cy="72" rx="3" ry="4" fill="#e8a080"/>
              <ellipse cx="93" cy="72" rx="3" ry="4" fill="#e8a080"/>
              {/* Eyebrows - stern */}
              <path d="M48 60 Q56 57 60 60" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M70 60 Q74 57 82 60" stroke="#8B4513" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              {/* Eyes */}
              <ellipse cx="55" cy="67" rx="5" ry="5.5" fill="white"/>
              <ellipse cx="75" cy="67" rx="5" ry="5.5" fill="white"/>
              <circle cx="56" cy="68" r="3" fill="#2d1b00"/>
              <circle cx="76" cy="68" r="3" fill="#2d1b00"/>
              <circle cx="57" cy="67" r="1" fill="white"/>
              <circle cx="77" cy="67" r="1" fill="white"/>
              {/* Mole / tahi lalat */}
              <circle cx="80" cy="78" r="2.5" fill="#5a2d0c"/>
              {/* Nose */}
              <ellipse cx="65" cy="74" rx="5" ry="4" fill="#e8a080"/>
              <circle cx="62" cy="75" r="1.5" fill="#c87060"/>
              <circle cx="68" cy="75" r="1.5" fill="#c87060"/>
              {/* Mouth - slight smile/smirk */}
              <path d="M57 82 Q65 87 73 82" stroke="#c07050" strokeWidth="2" fill="none" strokeLinecap="round"/>
              {/* Stubble hints */}
              <path d="M52 84 Q53 86 54 84" stroke="#c09080" strokeWidth="1" fill="none"/>
              <path d="M75 84 Q76 86 77 84" stroke="#c09080" strokeWidth="1" fill="none"/>
              {/* Whistle around neck */}
              <path d="M52 97 Q65 104 78 97" stroke="#fbbf24" strokeWidth="2.5" fill="none"/>
              <circle cx="65" cy="104" r="4" fill="#fbbf24"/>
              {/* Arms */}
              <path d="M27 108 Q18 120 22 132" stroke="#2c5aa0" strokeWidth="10" strokeLinecap="round" fill="none"/>
              <ellipse cx="22" cy="134" rx="6" ry="5" fill="#f5c5a3"/>
              <path d="M103 108 Q112 120 108 132" stroke="#2c5aa0" strokeWidth="10" strokeLinecap="round" fill="none"/>
              <ellipse cx="108" cy="134" rx="6" ry="5" fill="#f5c5a3"/>
              {/* Clipboard in hand */}
              <rect x="111" y="126" width="14" height="18" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5"/>
              <line x1="113" y1="131" x2="123" y2="131" stroke="#92400e" strokeWidth="1"/>
              <line x1="113" y1="134" x2="123" y2="134" stroke="#92400e" strokeWidth="1"/>
              <line x1="113" y1="137" x2="120" y2="137" stroke="#92400e" strokeWidth="1"/>
              {/* Legs */}
              <rect x="48" y="145" width="12" height="14" rx="4" fill="#1e3a5f"/>
              <rect x="70" y="145" width="12" height="14" rx="4" fill="#1e3a5f"/>
              {/* Shoes */}
              <ellipse cx="54" cy="158" rx="10" ry="4" fill="#111"/>
              <ellipse cx="76" cy="158" rx="10" ry="4" fill="#111"/>
              {/* Belt */}
              <rect x="30" y="138" width="70" height="6" rx="3" fill="#1e3a5f"/>
              <rect x="60" y="137" width="10" height="8" rx="2" fill="#fbbf24"/>
            </svg>
            {/* Speech bubble */}
            <motion.div initial={{scale:0,opacity:0}}animate={{scale:1,opacity:1}}transition={{delay:1.2,type:'spring'}}
              className="absolute -top-2 -right-2 bg-white rounded-2xl rounded-bl-none px-3 py-1.5 shadow-lg"
              style={{minWidth:90}}>
              <p className="text-[10px] font-black text-slate-800 text-center leading-tight">Halo, Bobotoh!<br/><span className="text-blue-600">Ayo main! 🐯</span></p>
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <div className="text-center mb-4">
          <div className="text-[10px] text-amber-400/70 tracking-widest font-semibold mb-1">🎮 FOOTBALL MANAGER GAME</div>
          <h1 className="text-xl font-black text-white leading-tight">SEHARI MENJADI</h1>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 leading-tight">BOJAN HODAK</h1>
          <p className="text-[10px] text-slate-400 mt-1">BRI Super League 2025/26 · 18 Tim · 295 Pemain</p>
        </div>

        <Glass className="p-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500"/>
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600"/>
          <motion.div initial={{opacity:0}}animate={{opacity:1}}transition={{delay:0.6}}className="text-center mb-4">
            <div className="inline-block bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-xs text-amber-400/80 tracking-widest mb-1">SPECIAL THANKS TO</div>
            <div className="text-sm font-bold text-amber-300">AR RAZI NUR INSAN</div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1"><MapPin size={9}/>Bobotoh Cimahi</div>
          </motion.div>
          <div className="space-y-3">
            <div><label className="text-[10px] text-slate-400 font-semibold tracking-widest block mb-1.5">NAMA MANAGER</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/><input type="text" value={tmpName} onChange={e=>setTmpName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(tmpName.trim()&&tmpRegion.trim()&&(setManagerName(tmpName.trim()),setManagerRegion(tmpRegion.trim()),setPhase('welcome')))} placeholder="Nama kamu..." className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 pl-9 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"/></div>
            </div>
            <div><label className="text-[10px] text-slate-400 font-semibold tracking-widest block mb-1.5">BOBOTOH DARI MANA?</label>
              <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/><input type="text" value={tmpRegion} onChange={e=>setTmpRegion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(tmpName.trim()&&tmpRegion.trim()&&(setManagerName(tmpName.trim()),setManagerRegion(tmpRegion.trim()),setPhase('welcome')))} placeholder="Kota / daerah..." className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 pl-9 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"/></div>
            </div>
            <motion.button whileHover={{scale:1.02}}whileTap={{scale:0.98}}onClick={()=>{if(tmpName.trim()&&tmpRegion.trim()){setManagerName(tmpName.trim());setManagerRegion(tmpRegion.trim());setPhase('trivia');}}}disabled={!tmpName.trim()||!tmpRegion.trim()}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all ${tmpName.trim()&&tmpRegion.trim()?'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30':'bg-slate-700/40 text-slate-500 cursor-not-allowed'}`}>
              <Swords size={18}/>MULAI KARIR
            </motion.button>
          </div>
        </Glass>
        <div className="text-center mt-4 text-xs text-slate-500">Maung Bandung · Juara BRI Liga 1 2024/25 🏆</div>
      </motion.div>
    </div>
  );

  if(phase==='trivia'){
    const TRIVIA_TABS=[
      {id:'sejarah',label:'📜 Sejarah',icon:'📜'},
      {id:'rekor',label:'🏆 Rekor',icon:'🏆'},
      {id:'squad',label:'👥 Skuad',icon:'👥'},
    ];
    const [triviaTab,setTriviaTab]=React.useState('sejarah');
    const GELAR=[
      {tahun:'1937',kompetisi:'Kejurnas PSSI',lawan:'Persis Surakarta',skor:'1-0'},
      {tahun:'1961',kompetisi:'Kejurnas PSSI',lawan:'-',skor:'-'},
      {tahun:'1986',kompetisi:'Perserikatan',lawan:'Perseman Manokwari',skor:'1-0'},
      {tahun:'1990',kompetisi:'Perserikatan',lawan:'-',skor:'-'},
      {tahun:'1994',kompetisi:'Perserikatan',lawan:'PSM Makassar',skor:'2-0'},
      {tahun:'1994/95',kompetisi:'Liga Indonesia',lawan:'Petrokimia Putra',skor:'1-0'},
      {tahun:'2014',kompetisi:'ISL',lawan:'Persipura',skor:'Pen. 5-3'},
      {tahun:'2023/24',kompetisi:'BRI Liga 1',lawan:'Madura United',skor:'3-0'},
      {tahun:'2024/25',kompetisi:'BRI Liga 1',lawan:'-',skor:'64 poin'},
    ];
    const SCORERS=[
      {rank:1,name:'David da Silva',goals:73,nat:'🇧🇷',era:'2021–kini'},
      {rank:2,name:'Christian González',goals:28,nat:'🇺🇾',era:'2009–2012'},
      {rank:3,name:'Sergio van Dijk',goals:21,nat:'🇮🇩',era:'2013–2014'},
      {rank:4,name:'Airlangga Sucipto',goals:21,nat:'🇮🇩',era:'2008–2019'},
      {rank:5,name:'Sutiono Lamso',goals:41,nat:'🇮🇩',era:'1988–2001'},
    ];
    const SQUAD_NOW=[
      {no:1,name:'Teja Paku Alam',pos:'GK',nat:'🇮🇩'},{no:31,name:'Adam Przybek',pos:'GK',nat:'🏴󠁧󠁢󠁷󠁬󠁳󠁿'},
      {no:13,name:'Layvin Kurzawa',pos:'LB',nat:'🇫🇷'},{no:4,name:'Federico Barba',pos:'CB',nat:'🇮🇹'},
      {no:5,name:'Patricio Matricardi',pos:'CB',nat:'🇦🇷'},{no:3,name:'Frans Putros',pos:'CB',nat:'🇮🇶'},
      {no:22,name:'Dion Markx',pos:'RB',nat:'🇳🇱'},
      {no:8,name:'Thom Haye',pos:'DM',nat:'🇮🇩'},{no:7,name:'Marc Klok',pos:'CM',nat:'🇮🇩'},
      {no:10,name:'Adam Alis',pos:'CM',nat:'🇮🇩'},{no:11,name:'Berguinho',pos:'AM',nat:'🇧🇷'},
      {no:77,name:'Eliano Reijnders',pos:'RW',nat:'🇮🇩'},{no:9,name:'Andrew Jung',pos:'ST',nat:'🇫🇷'},
      {no:17,name:'Sergio Castel',pos:'ST',nat:'🇪🇸'},{no:20,name:'Saddil Ramdani',pos:'LW',nat:'🇮🇩'},
    ];
    return(
      <div className="min-h-screen relative flex justify-center overflow-hidden">
        <TigerBg/>
        <div className="relative z-10 w-full max-w-md flex flex-col min-h-screen">
          {/* Header */}
          <div className="px-4 pt-5 pb-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 border-2 border-amber-400 flex items-center justify-center flex-shrink-0"><Shield className="text-white" size={20}/></div>
              <div>
                <h1 className="text-lg font-black text-white leading-tight">Persib Bandung</h1>
                <p className="text-[10px] text-slate-400">Berdiri 1933 · Maung Bandung 🐯</p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xl font-black text-amber-400">9×</div>
                <div className="text-[9px] text-slate-400">Juara Liga</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-4 mb-3">
            {TRIVIA_TABS.map(t=>(
              <button key={t.id} onClick={()=>setTriviaTab(t.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${triviaTab===t.id?'bg-blue-600 text-white':'bg-white/8 text-slate-400 hover:bg-white/12'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-3">
            {/* ── SEJARAH TAB ── */}
            {triviaTab==='sejarah'&&(<>
              <Glass className="p-4">
                <div className="text-[10px] text-blue-400 font-bold tracking-widest mb-3">📖 SEJARAH SINGKAT</div>
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <p>Persib didirikan pada <span className="text-white font-semibold">14 Maret 1933</span> dari peleburan BIVB (1919) dan beberapa klub Bandung lainnya. Awalnya bernama <span className="text-blue-300">Bandoeng Inlandsche Voetbal Bond</span>.</p>
                  <p>Dijuluki <span className="text-amber-400 font-semibold">"Maung Bandung"</span> (Harimau Bandung), Persib memiliki suporter fanatik yang disebut <span className="text-blue-300 font-semibold">Bobotoh</span> — salah satu kelompok suporter terbesar di Asia Tenggara.</p>
                  <p>Di bawah pelatih asal Kroasia <span className="text-white font-semibold">Bojan Hodak</span>, Persib meraih gelar <span className="text-amber-400 font-semibold">back-to-back Liga 1 2023/24 & 2024/25</span> — sejarah pertama dalam sejarah klub.</p>
                </div>
              </Glass>
              <Glass className="p-4">
                <div className="text-[10px] text-amber-400 font-bold tracking-widest mb-3">🏆 DAFTAR JUARA (9 GELAR)</div>
                <div className="space-y-1.5">
                  {GELAR.map((g,i)=>(
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition">
                      <div className="text-amber-400 font-black text-sm w-14 flex-shrink-0">{g.tahun}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{g.kompetisi}</div>
                        {g.lawan!=='-'&&<div className="text-[9px] text-slate-400">vs {g.lawan} {g.skor}</div>}
                      </div>
                      <div className="text-amber-400">🏆</div>
                    </div>
                  ))}
                </div>
              </Glass>
              <Glass className="p-4">
                <div className="text-[10px] text-emerald-400 font-bold tracking-widest mb-3">📊 FAKTA MENARIK</div>
                <div className="space-y-2">
                  {[
                    {icon:'🎽',label:'Warna Jersey',val:'Biru & Putih'},
                    {icon:'🏟️',label:'Stadion Kandang',val:'GBLA & Si Jalak Harupat'},
                    {icon:'📅',label:'Berdiri',val:'14 Maret 1933'},
                    {icon:'🌍',label:'Kota',val:'Bandung, Jawa Barat'},
                    {icon:'👥',label:'Suporter',val:'Bobotoh (jutaan)'},
                    {icon:'⚽',label:'Rival Abadi',val:'Persija Jakarta'},
                    {icon:'🥇',label:'Rekor 2025',val:'11 kemenangan tandang terbaik'},
                    {icon:'📺',label:'Gelar Back-to-Back',val:'2023/24 & 2024/25 Liga 1'},
                  ].map(({icon,label,val})=>(
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-xs text-slate-400 flex items-center gap-2">{icon} {label}</span>
                      <span className="text-xs font-semibold text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </Glass>
            </>)}

            {/* ── REKOR TAB ── */}
            {triviaTab==='rekor'&&(<>
              <Glass className="p-4">
                <div className="text-[10px] text-amber-400 font-bold tracking-widest mb-3">⚽ TOP SCORER SEPANJANG MASA</div>
                <div className="space-y-2">
                  {SCORERS.sort((a,b)=>b.goals-a.goals).map((s,i)=>(
                    <div key={s.name} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${i===0?'bg-amber-500/15 border border-amber-500/25':'bg-white/5'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${i===0?'bg-amber-500 text-black':i===1?'bg-slate-400 text-black':i===2?'bg-amber-700 text-white':'bg-slate-700 text-slate-300'}`}>{i+1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{s.nat} {s.name}</div>
                        <div className="text-[9px] text-slate-400">{s.era}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-black text-amber-400">{s.goals}</div>
                        <div className="text-[9px] text-slate-500">gol</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-slate-500 mt-2 text-center">* David da Silva memegang rekor pencetak gol terbanyak sepanjang masa dengan 73 gol (update 2025)</p>
              </Glass>
              <Glass className="p-4">
                <div className="text-[10px] text-purple-400 font-bold tracking-widest mb-3">🏅 REKOR MUSIM 2024/25</div>
                <div className="space-y-2">
                  {[
                    {icon:'⚽',stat:'Top Scorer',val:'Gustavo Franca',sub:'18 gol'},
                    {icon:'🎯',stat:'Top Assist',val:'Tyronne del Pino',sub:'15 assist'},
                    {icon:'🛫',stat:'Kemenangan Tandang',val:'11 kali',sub:'Rekor terbaik Liga 1'},
                    {icon:'📅',stat:'Juara di Pekan ke-',val:'31',sub:'Juara tercepat ke-2 sepanjang sejarah'},
                    {icon:'🏆',stat:'Total Poin',val:'69 poin',sub:'dari 34 laga'},
                    {icon:'💪',stat:'Pemain Kontribusi',val:'18 dari 28',sub:'Pemain skuad utama'},
                  ].map(({icon,stat,val,sub})=>(
                    <div key={stat} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
                      <div className="text-xl flex-shrink-0">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-slate-400">{stat}</div>
                        <div className="text-sm font-bold text-white">{val}</div>
                      </div>
                      <div className="text-[9px] text-slate-500 text-right">{sub}</div>
                    </div>
                  ))}
                </div>
              </Glass>
            </>)}

            {/* ── SQUAD TAB ── */}
            {triviaTab==='squad'&&(<>
              <Glass className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] text-blue-400 font-bold tracking-widest">SKUAD 2025/26</div>
                  <div className="text-[9px] text-slate-500">Under Bojan Hodak</div>
                </div>
                {/* Position groups */}
                {(['GK','DF','MF','FW'] as const).map(pos=>{
                  const posLabel={GK:'⬛ Kiper',DF:'🔵 Pertahanan',MF:'🟢 Tengah',FW:'🔴 Penyerang'}[pos];
                  const posMap={GK:['GK'],DF:['CB','LB','RB'],MF:['DM','CM','AM'],FW:['LW','RW','ST']};
                  const players=SQUAD_NOW.filter(p=>posMap[pos].includes(p.pos));
                  return(
                    <div key={pos} className="mb-4">
                      <div className="text-[10px] font-bold text-slate-400 mb-2">{posLabel}</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {players.map(p=>(
                          <div key={p.no} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 border border-white/8">
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0">{p.no}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-semibold text-white truncate">{p.name.split(' ').slice(-1)[0]}</div>
                              <div className="text-[8px] text-slate-500">{p.nat} {p.pos}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Glass>
              <Glass className="p-4">
                <div className="text-[10px] text-amber-400 font-bold tracking-widest mb-3">⭐ PEMAIN KUNCI</div>
                {[
                  {name:'Thom Haye',pos:'Gelandang Bertahan',flag:'🇮🇩',desc:'Kapten lapangan, motor permainan Persib',rating:86},
                  {name:'Layvin Kurzawa',pos:'Bek Kiri',flag:'🇫🇷',desc:'Mantan PSG, stabilisator lini belakang',rating:85},
                  {name:'Eliano Reijnders',pos:'Sayap Kanan',flag:'🇮🇩',desc:'Adik Tijjani Reijnders, winger tajam',rating:83},
                  {name:'Andrew Jung',pos:'Striker',flag:'🇫🇷',desc:'Finisher andalan Maung Bandung',rating:81},
                ].map(p=>(
                  <div key={p.name} className="flex items-center gap-3 mb-3 last:mb-0 p-2.5 rounded-xl bg-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 border-2 border-amber-400/50 flex items-center justify-center flex-shrink-0"><span className="text-base">{p.flag}</span></div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{p.name}</div>
                      <div className="text-[9px] text-slate-400">{p.pos}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{p.desc}</div>
                    </div>
                    <div className="text-amber-400 font-black text-lg">{p.rating}</div>
                  </div>
                ))}
              </Glass>
            </>)}
          </div>

          {/* Fixed bottom */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-4 pt-2 bg-gradient-to-t from-slate-950 to-transparent">
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setPhase('welcome')}
              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 text-white shadow-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/30">
              <Play size={20} fill="currentColor"/>Siap Melatih Maung Bandung!
            </motion.button>
            <p className="text-center text-[10px] text-slate-500 mt-2">
              🐛 Bug & saran? Follow <a href="https://instagram.com/arrazynur" target="_blank" className="text-blue-400 underline">@arrazynur</a> di Instagram
            </p>
          </div>
        </div>
      </div>
    );
  }
  if(phase==='welcome')return(
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden"><TigerBg/>
      <motion.div initial={{opacity:0}}animate={{opacity:1}}className="relative z-10 text-center px-8 max-w-sm">
        <motion.h1 initial={{y:-30,opacity:0}}animate={{y:0,opacity:1}}transition={{delay:0.2,duration:0.6}}className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-4">Wilujeng Sumping!</motion.h1>
        <motion.div initial={{opacity:0,y:20}}animate={{opacity:1,y:0}}transition={{delay:0.5}}className="space-y-1 mb-8"><p className="text-2xl font-bold text-white">Coach {managerName}</p><p className="text-slate-400 flex items-center justify-center gap-1"><MapPin size={14}className="text-blue-400"/>Bobotoh dari {managerRegion}</p></motion.div>
        <motion.div initial={{scale:0,rotate:-180}}animate={{scale:1,rotate:0}}transition={{delay:0.7,type:'spring',stiffness:150}}className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-blue-900 border-4 border-amber-400 flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-8"><Shield className="text-white" size={56}/></motion.div>
        <motion.p initial={{opacity:0}}animate={{opacity:1}}transition={{delay:1}}className="text-slate-400 mb-8 leading-relaxed">Siap memimpin Maung Bandung merajai BRI Super League 2025/26? 17 pertandingan menanti!</motion.p>
        <motion.button initial={{opacity:0,y:20}}animate={{opacity:1,y:0}}transition={{delay:1.2}}whileHover={{scale:1.05}}whileTap={{scale:0.95}}onClick={()=>setPhase('game')}className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-10 py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center gap-2 mx-auto">
          <Play size={20}fill="currentColor"/>Masuk ke Markas
        </motion.button>
      </motion.div>
    </div>
  );

  // ── MAIN GAME ─────────────────────────────────────────────────
  return(
    <div className="min-h-screen relative flex justify-center overflow-hidden">
      <TigerBg/>
      <Confetti active={showConfetti}/>
      <AnimatePresence>{goalToast&&<GoalToast{...goalToast}onDone={()=>setGoalToast(null)}/>}</AnimatePresence>

      {/* Coach Advice Modal */}
      <AnimatePresence>
        {showCoachAdvice&&(
          <motion.div initial={{opacity:0}}animate={{opacity:1}}exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <motion.div initial={{scale:0.9,y:20}}animate={{scale:1,y:0}}exit={{scale:0.9,y:20}}
              className="w-full max-w-xs bg-slate-900/98 border border-blue-500/30 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 border-2 border-amber-400 flex items-center justify-center flex-shrink-0 text-xl">🧠</div>
                <div>
                  <div className="text-[10px] text-blue-400 font-black tracking-widest">ASISTEN PELATIH</div>
                  <div className="text-xs text-slate-400">Sisa saran: {coachAdviceLeft} kali</div>
                </div>
              </div>
              <div className="space-y-2.5 mb-4">
                {getCoachAdvice().map((tip,i)=>(
                  <div key={i} className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3 text-xs text-slate-200 leading-relaxed">{tip}</div>
                ))}
              </div>
              <button onClick={()=>{setShowCoachAdvice(false);setIsPaused(false);}}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition">
                Terima kasih, Lanjutkan ▶
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Summary Modal */}
      <AnimatePresence>
        {matchSummary&&screen!=='match'&&(
          <motion.div initial={{opacity:0}}animate={{opacity:1}}exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-3 pb-3">
            <motion.div initial={{y:100}}animate={{y:0}}exit={{y:100}}transition={{type:'spring',stiffness:280,damping:28}}
              className="w-full max-w-md bg-slate-900/98 border border-white/15 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className={`p-4 rounded-t-2xl flex items-center justify-between ${matchSummary.result==='W'?'bg-green-900/60':matchSummary.result==='L'?'bg-red-900/60':'bg-amber-900/60'}`}>
                <div>
                  <div className="text-[10px] font-black tracking-widest text-white/70">RINGKASAN PERTANDINGAN</div>
                  <div className="text-lg font-black text-white">PERSIB {matchSummary.ps} — {matchSummary.os} {matchSummary.oppName.split(' ')[0]}</div>
                </div>
                <div className={`text-3xl font-black ${matchSummary.result==='W'?'text-green-400':matchSummary.result==='L'?'text-red-400':'text-amber-400'}`}>
                  {matchSummary.result==='W'?'MENANG':matchSummary.result==='L'?'KALAH':'SERI'}
                </div>
              </div>
              {/* MOTM */}
              <div className="px-4 py-2.5 border-b border-white/8 flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <div><div className="text-[9px] text-amber-400 font-bold">MAN OF THE MATCH</div><div className="text-sm font-bold text-white">{matchSummary.motm}</div></div>
              </div>
              {/* Player ratings */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                <div className="text-[9px] text-slate-500 font-semibold tracking-widest px-1 mb-2">RATING PEMAIN</div>
                {matchSummary.playerRatings.map((p,i)=>{
                  const rCol=p.rating>=8?'text-green-400':p.rating>=7?'text-emerald-400':p.rating>=6?'text-amber-400':p.rating>=5?'text-orange-400':'text-red-400';
                  const isMotm=p.name===matchSummary.motm;
                  return(
                    <div key={p.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${isMotm?'bg-amber-500/10 border border-amber-500/20':'bg-white/4'}`}>
                      <div className="text-[9px] text-slate-500 w-4 text-center">{i+1}</div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 ${p.pos==='GK'?'bg-amber-500/30 text-amber-300':p.pos==='DF'?'bg-blue-500/30 text-blue-300':p.pos==='MF'?'bg-emerald-500/30 text-emerald-300':'bg-red-500/30 text-red-300'}`}>{p.pos}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                          {p.name}
                          {isMotm&&<span className="text-[9px] text-amber-400">⭐</span>}
                        </div>
                        <div className="text-[9px] text-slate-500 flex gap-2">
                          {p.goals>0&&<span className="text-blue-400">⚽{p.goals}</span>}
                          {p.assists>0&&<span className="text-emerald-400">🎯{p.assists}</span>}
                          {p.carded&&<span className="text-yellow-400">🟨</span>}
                        </div>
                      </div>
                      <div className={`text-base font-black ${rCol}`}>{p.rating.toFixed(1)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 flex gap-2 border-t border-white/8">
                <button onClick={()=>setMatchSummary(null)} className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-slate-300 font-semibold text-sm hover:bg-slate-600/50 transition">Tutup</button>
                <button onClick={()=>{setMatchSummary(null);setScreen('home');}} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition">Ke Home →</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Offer Modal */}
      <AnimatePresence>
        {transferOffer&&(
          <motion.div initial={{opacity:0}}animate={{opacity:1}}exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <motion.div initial={{scale:0.9,y:20}}animate={{scale:1,y:0}}exit={{scale:0.9,y:20}}
              className="w-full max-w-xs bg-slate-900/98 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl">
              <div className="text-[10px] text-emerald-400 font-black tracking-widest mb-2 flex items-center gap-1.5">💰 TAWARAN TRANSFER MASUK!</div>
              <div className="bg-white/5 rounded-xl p-3 mb-4">
                <div className="text-xs text-slate-400 mb-1">{transferOffer.fromClub} menginginkan:</div>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-xs`}
                    style={{background:transferOffer.player.pos==='GK'?'#d97706':transferOffer.player.pos==='DF'?'#1d4ed8':transferOffer.player.pos==='MF'?'#059669':'#dc2626'}}>
                    {transferOffer.player.pos}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{transferOffer.player.name}</div>
                    <div className="text-[10px] text-slate-400">{transferOffer.player.posInd} · Rating {transferOffer.player.rating}</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Form: {Math.round(transferOffer.player.form)}% · Penampilan: {transferOffer.player.matchesPlayed}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-400">Nilai pasar</span>
                <span className="text-white font-bold">{transferOffer.player.price}M</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                <span className="text-sm text-slate-300 font-semibold">Penawaran</span>
                <span className="text-emerald-400 font-black text-xl">{transferOffer.offerPrice}M</span>
              </div>
              <p className="text-[10px] text-slate-400 mb-4 text-center">
                Pemain ini sedang dalam performa terbaik. Klub tertarik karena {transferOffer.player.form>90?'form luar biasa':'rating tinggi'}-nya.
              </p>
              <div className="flex gap-2">
                <button onClick={()=>handleTransferOffer(false)} className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-slate-300 font-bold text-sm">❌ Tolak</button>
                <button onClick={()=>handleTransferOffer(true)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition">✅ Jual +{transferOffer.offerPrice}M</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Penalty Modal */}
      <AnimatePresence>
        {penaltyEvent&&(
          <motion.div initial={{opacity:0}}animate={{opacity:1}}exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <motion.div initial={{scale:0.85,y:30}}animate={{scale:1,y:0}}exit={{scale:0.85,y:30}}transition={{type:'spring',stiffness:250,damping:22}}
              className={`w-full max-w-xs rounded-2xl p-6 shadow-2xl border ${penaltyEvent.isP?'bg-blue-950/98 border-amber-400/40':'bg-red-950/98 border-red-500/40'}`}>
              <div className={`text-[11px] font-black tracking-widest mb-1 text-center ${penaltyEvent.isP?'text-amber-400':'text-red-400'}`}>
                {penaltyEvent.isP?'⚽ PENALTI UNTUK PERSIB!':'🚨 PENALTI UNTUK LAWAN!'}
              </div>
              <div className="text-center text-sm text-white font-bold mb-1">{penaltyEvent.taker}</div>
              <div className="text-center text-xs text-slate-400 mb-5">
                {penaltyEvent.isP
                  ?'Pilih arah tendangan! Sudut lebih sulit tapi lebih berpeluang masuk.'
                  :'Tim bertahan! Tebak arah bola ke mana kiper melompat.'}
              </div>
              {/* Goal visual */}
              <div className="relative mb-5 mx-4">
                <div className="w-full h-16 border-2 border-white/30 rounded-sm bg-emerald-900/30 relative overflow-hidden flex">
                  <div className="flex-1 border-r border-white/20 flex items-center justify-center text-white/40 text-[10px]">KIRI</div>
                  <div className="flex-1 border-r border-white/20 flex items-center justify-center text-white/40 text-[10px]">TENGAH</div>
                  <div className="flex-1 flex items-center justify-center text-white/40 text-[10px]">KANAN</div>
                </div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xl">⚽</div>
              </div>
              {penaltyEvent.isP?(
                <div className="grid grid-cols-3 gap-2">
                  {(['left','center','right'] as const).map(dir=>(
                    <motion.button key={dir} whileHover={{scale:1.05}} whileTap={{scale:0.92}}
                      onClick={()=>handlePenalty(dir)}
                      className="py-3 rounded-xl font-bold text-xs text-white transition bg-blue-700/60 hover:bg-blue-600/80 border border-blue-500/30 flex flex-col items-center gap-1">
                      {dir==='left'?'←':dir==='right'?'→':'↑'}
                      <span className="text-[9px] font-normal opacity-70">{dir==='left'?'Kiri':dir==='right'?'Kanan':'Tengah'}</span>
                    </motion.button>
                  ))}
                </div>
              ):(
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 text-center mb-2">Instruksikan kiper melompat ke mana?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['left','center','right'] as const).map(dir=>(
                      <motion.button key={dir} whileHover={{scale:1.05}} whileTap={{scale:0.92}}
                        onClick={()=>handlePenalty(dir)}
                        className="py-3 rounded-xl font-bold text-xs text-white transition bg-red-800/60 hover:bg-red-700/80 border border-red-500/30 flex flex-col items-center gap-1">
                        {dir==='left'?'🧤←':dir==='right'?'→🧤':'🧤'}
                        <span className="text-[9px] font-normal opacity-70">{dir==='left'?'Kiri':dir==='right'?'Kanan':'Tengah'}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-center text-[9px] text-slate-500 mt-3">
                OVR tim lebih tinggi = peluang masuk lebih besar
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision Modal */}
      <AnimatePresence>
        {activeDecision&&(
          <motion.div initial={{opacity:0}}animate={{opacity:1}}exit={{opacity:0}}className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <motion.div initial={{scale:0.9,y:20}}animate={{scale:1,y:0}}exit={{scale:0.9,y:20}}className="w-full max-w-xs bg-slate-900/98 border border-amber-500/30 rounded-2xl p-5 shadow-2xl">
              <div className="text-[10px] text-amber-400 font-black tracking-widest mb-2 flex items-center gap-1.5">⚡ MOMEN KRITIS — {activeDecision.minute}'</div>
              <p className="text-sm font-semibold text-white mb-4 leading-relaxed">{activeDecision.situation}</p>
              <div className="space-y-2">
                {activeDecision.options.map((opt,i)=>(
                  <button key={i}onClick={()=>handleDecision(opt.effect)}
                    className="w-full p-3 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 hover:border-amber-500/40 text-left text-sm text-white font-medium transition flex items-center gap-3">
                    <span className="text-xl">{opt.emoji}</span>{opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sell Modal */}
      <AnimatePresence>{sellTarget&&<SellModal player={sellTarget}onConfirm={executeSell}onCancel={()=>setSellTarget(null)}/>}</AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification&&(
          <motion.div initial={{y:-60,opacity:0}}animate={{y:0,opacity:1}}exit={{y:-60,opacity:0}}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl backdrop-blur-xl border max-w-xs text-center
              ${notification.type==='good'?'bg-green-900/90 border-green-500/40 text-green-300':notification.type==='bad'?'bg-red-900/90 border-red-500/40 text-red-300':'bg-slate-800/90 border-white/20 text-slate-200'}`}>
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly event */}
      <AnimatePresence>
        {weeklyEvent&&(
          <motion.div initial={{opacity:0}}animate={{opacity:1}}exit={{opacity:0}}className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-4">
            <motion.div initial={{y:100}}animate={{y:0}}exit={{y:100}}transition={{type:'spring',stiffness:300,damping:30}}className="w-full max-w-xs bg-slate-900/98 border border-white/20 rounded-2xl p-5 shadow-2xl">
              <div className={`text-xs font-bold tracking-widest mb-2 ${weeklyEvent.type==='good'?'text-green-400':weeklyEvent.type==='bad'?'text-red-400':'text-amber-400'}`}>{weeklyEvent.type==='good'?'🎉 BERITA BAGUS!':weeklyEvent.type==='bad'?'⚠️ MASALAH!':'📋 INFO'}</div>
              <h3 className="font-bold text-white text-base mb-1">{weeklyEvent.title}</h3>
              <p className="text-slate-400 text-sm mb-4">{weeklyEvent.desc}</p>
              <button onClick={()=>setWeeklyEvent(null)}className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition">OK</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy Confirm */}
      <AnimatePresence>
        {buyConfirm&&(
          <motion.div initial={{opacity:0}}animate={{opacity:1}}exit={{opacity:0}}className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"onClick={()=>setBuyConfirm(null)}>
            <motion.div initial={{scale:0.9,y:20}}animate={{scale:1,y:0}}exit={{scale:0.9,y:20}}onClick={e=>e.stopPropagation()}className="w-full max-w-xs bg-slate-900/98 border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-start mb-4"><h3 className="font-bold text-white text-lg">Konfirmasi Beli</h3><button onClick={()=>setBuyConfirm(null)}className="text-slate-400 hover:text-white"><X size={20}/></button></div>
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2"><span className={`text-xs font-black px-2 py-1 rounded ${posBg(buyConfirm.pos)} ${posColor(buyConfirm.pos)}`}>{buyConfirm.posInd}</span><span className="text-amber-400 font-bold flex items-center gap-1"><Star size={12}/>{buyConfirm.rating}</span></div>
                <p className="font-bold text-white">{buyConfirm.name}</p><p className="text-slate-400 text-xs mt-1">{buyConfirm.club} · {buyConfirm.nationality}</p>
              </div>
              <div className="flex justify-between items-center mb-5"><span className="text-slate-400 text-sm">Harga</span><span className="text-emerald-400 font-bold text-lg">{buyConfirm.price}M</span></div>
              <div className="flex gap-3">
                <button onClick={()=>setBuyConfirm(null)}className="flex-1 py-2.5 rounded-xl bg-slate-700/50 text-slate-300 font-semibold text-sm">Batal</button>
                <button onClick={executeBuy}disabled={budget<buyConfirm.price}className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${budget>=buyConfirm.price?'bg-blue-600 hover:bg-blue-500 text-white':'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>{budget>=buyConfirm.price?'Beli!':'Budget Kurang'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-md min-h-screen flex flex-col">
        {/* TOPBAR */}
        <header className="mx-3 mt-3">
          <Glass className="px-4 py-2.5 flex justify-between items-center border-t-2 border-t-amber-500">
            <div><div className="text-base font-extrabold text-white flex items-center gap-1.5 tracking-tight"><Shield className="text-blue-400" size={17}/>PERSIB <span className="text-amber-400 font-light text-sm ml-0.5">2026</span></div><div className="text-[10px] text-slate-400 mt-0.5"><User size={9}className="inline mr-1"/>{managerName} · {managerRegion}</div></div>
            <div className="flex items-center gap-3">
              <button onClick={()=>{setSoundOn(!soundOn);if(soundOn)playClick();}}className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition">{soundOn?<Volume2 size={14}className="text-blue-400"/>:<VolumeX size={14}className="text-slate-500"/>}</button>
              <div className="text-right"><div className="text-sm font-bold text-emerald-400 flex items-center gap-0.5"><DollarSign size={12}/>{budget.toFixed(1)}M</div><div className="text-[10px] flex items-center gap-0.5 justify-end"><Heart size={9}className={morale>50?'text-green-400':'text-red-400'}/><span className={morale>50?'text-green-400':'text-red-400'}>{morale}%</span></div></div>
            </div>
          </Glass>
        </header>

        <main className="flex-1 overflow-y-auto px-3 pt-3 pb-24">
          <AnimatePresence mode="wait">

            {/* HOME */}
            {screen==='home'&&(
              <motion.div key="home"initial={{opacity:0,y:16}}animate={{opacity:1,y:0}}exit={{opacity:0,y:-16}}transition={{duration:0.3}}className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Glass className="p-3 flex flex-col items-center"><Trophy size={18}className="text-amber-400"/><div className="text-[9px] text-slate-400 font-semibold mt-1">POIN</div><div className="text-xl font-black text-white">{points}</div></Glass>
                  <Glass className="p-3 flex flex-col items-center"><Activity size={18}className="text-blue-400"/><div className="text-[9px] text-slate-400 font-semibold mt-1">OVR TIM</div><div className="text-xl font-black text-white">{teamOvr}</div></Glass>
                  <Glass className="p-3 flex flex-col items-center"><BarChart2 size={18}className="text-purple-400"/><div className="text-[9px] text-slate-400 font-semibold mt-1">PEKAN</div><div className="text-xl font-black text-white">{week+1}/17</div></Glass>
                </div>
                <Glass className="px-4 py-2.5">
                  <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-400 flex items-center gap-1"><Heart size={11}/>Mood Bobotoh</span><span className={morale>65?'text-green-400':morale>35?'text-amber-400':'text-red-400'}>{morale}%</span></div>
                  <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden"><motion.div animate={{width:`${morale}%`}}transition={{duration:0.6}}className={`h-full rounded-full ${morale>65?'bg-green-500':morale>35?'bg-amber-500':'bg-red-500'}`}/></div>
                </Glass>
                {/* Streak + Standings gap */}
                <div className="grid grid-cols-2 gap-2">
                  <Glass className={`p-3 ${streak>=3?'border border-amber-500/30 bg-amber-500/5':streak<=-3?'border border-red-500/30 bg-red-500/5':''}`}>
                    <div className="text-[9px] text-slate-400 mb-1">{streak>=3?'🔥 ON FIRE!':streak<=-3?'💔 KRISIS':streak>0?'📈 TREN POSITIF':streak<0?'📉 TREN NEGATIF':'➖ NETRAL'}</div>
                    <div className={`text-lg font-black ${streak>=3?'text-amber-400':streak<=-3?'text-red-400':streak>0?'text-green-400':streak<0?'text-red-400':'text-slate-400'}`}>
                      {streak>0?`${streak}× Menang`:streak<0?`${Math.abs(streak)}× Kalah`:'–'}
                    </div>
                    {streak>=3&&<div className="text-[9px] text-amber-300 mt-0.5">Morale & form bonus aktif!</div>}
                    {streak<=-3&&<div className="text-[9px] text-red-300 mt-0.5">Morale tim tertekan</div>}
                  </Glass>
                  <Glass className="p-3">
                    {(()=>{
                      const myPos=sortedStandings.findIndex(t=>t.name==='Persib Bandung');
                      const myPts=sortedStandings[myPos]?.points??0;
                      const leaderPts=sortedStandings[0]?.points??0;
                      const relegPts=sortedStandings[sortedStandings.length-4]?.points??0;
                      const gapTop=leaderPts-myPts;
                      const gapRel=myPts-relegPts;
                      return(<>
                        <div className="text-[9px] text-slate-400 mb-1">Posisi #{myPos+1} dari 18</div>
                        {gapTop>0?<div className="text-[10px] text-amber-400 font-semibold">−{gapTop} ke puncak</div>:<div className="text-[10px] text-amber-400 font-bold">🏆 PEMIMPIN KLASEMEN!</div>}
                        <div className={`text-[10px] font-semibold mt-0.5 ${gapRel<3?'text-red-400':gapRel<6?'text-amber-400':'text-green-400'}`}>+{gapRel} dari degradasi</div>
                      </>);
                    })()}
                  </Glass>
                </div>
                {/* Budget context */}
                <Glass className="px-4 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><DollarSign size={10}/>Budget Transfer</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400">{budget.toFixed(1)}M</span>
                    <span className="text-[9px] text-slate-500 ml-2">{budget>=15?'💰 Cukup beli pemain kelas 1':budget>=7?'💵 Cukup 1 pemain menengah':budget>=3?'🪙 Hanya pemain murah':'⚠️ Dana sangat terbatas'}</span>
                  </div>
                </Glass>
                {matchHistory.length>0&&<Glass className="px-4 py-2.5"><div className="text-[10px] text-slate-400 font-semibold mb-2">HASIL TERAKHIR</div><div className="flex gap-1.5">{matchHistory.slice(-7).map((m,i)=><div key={i}title={`${m.opp} ${m.score}`}className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${m.res==='M'?'bg-green-500/25 text-green-400 border border-green-500/30':m.res==='S'?'bg-amber-500/25 text-amber-400 border border-amber-500/30':'bg-red-500/25 text-red-400 border border-red-500/30'}`}>{m.res}</div>)}</div></Glass>}
                {/* Injury alerts */}
                {(squad.filter(p=>p.injured).length>0||squad.filter(p=>p.suspended).length>0)&&(
                  <Glass className="px-4 py-2.5 border border-red-500/20">
                    {squad.filter(p=>p.injured).map(p=><div key={p.id}className="text-[10px] text-red-300 flex items-center gap-1">🚑 <span className="font-semibold">{p.name}</span> — cedera {p.injuryWeeks} pekan lagi</div>)}
                    {squad.filter(p=>p.suspended).map(p=><div key={p.id}className="text-[10px] text-purple-300 flex items-center gap-1">🚫 <span className="font-semibold">{p.name}</span> — suspensi 1 laga</div>)}
                  </Glass>
                )}
                <Glass className={`p-5 border-t-4 relative overflow-hidden ${opp.isDerby?'border-t-red-500':'border-t-blue-500'}`}>
                  {opp.isDerby&&<div className="absolute top-3 right-3 bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Swords size={10}/>DERBY!</div>}
                  <div className="text-[10px] text-blue-400 font-bold mb-3 flex items-center gap-1.5"><Clock size={11}/>MATCHWEEK {week+1}/17</div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-center w-[40%]"><div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 border-2 border-amber-400 flex items-center justify-center"><Shield className="text-white" size={22}/></div><div className="font-bold text-white text-sm">PERSIB</div><div className="text-[10px] text-slate-400">OVR {teamOvr}</div><div className="text-[9px] text-blue-400">{formation}</div></div>
                    <div className="text-center"><div className="text-slate-500 font-black text-lg">VS</div><div className="text-[9px] text-slate-500">{opp.isAway?'Away':'Home'}</div></div>
                    <div className="text-center w-[40%]"><div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center border-2"style={{backgroundColor:opp.color+'22',borderColor:opp.color+'50'}}><Target className="text-white" size={22}/></div><div className="font-bold text-white text-sm truncate">{opp.name}</div><div className="text-[10px] text-slate-400">OVR {opp.ovr}</div><div className="text-[9px] text-slate-500">{opp.formation}</div></div>
                  </div>
                  <div className="text-[10px] text-slate-400 text-center mb-3 flex items-center justify-center gap-1"><MapPin size={10}/>{opp.isAway?opp.stadium:'Gelora Bandung Lautan Api'}</div>
                  <div className="flex gap-2">
                    <button onClick={()=>nav('preview')}className="flex-1 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition"><Eye size={14}/>Preview</button>
                    <button onClick={startMatch}disabled={!isValid}className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition ${isValid?'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30':'bg-slate-700/50 text-slate-500 cursor-not-allowed'}`}><Play size={14}fill="currentColor"/>Main</button>
                  </div>
                  {!isValid&&<p className="text-[10px] text-red-400 text-center mt-1.5 flex items-center justify-center gap-1"><AlertTriangle size={10}/>Butuh 11 pemain & 1 kiper</p>}
                </Glass>
                <div className="space-y-2">
                  {[{icon:<Settings size={16}className="text-blue-400"/>,label:'Taktik & Skuad',sub:`${starters.length}/11 starter`,s:'tactics'},{icon:<ShoppingBag size={16}className="text-emerald-400"/>,label:'Bursa Transfer',sub:`${market.length} tersedia`,s:'market'},{icon:<List size={16}className="text-amber-400"/>,label:'Statistik & Klasemen',sub:`Posisi #${sortedStandings.findIndex(t=>t.name==='Persib Bandung')+1}`,s:'stats'}].map(({icon,label,sub,s})=>(
                    <button key={s}onClick={()=>nav(s as Screen)}className="w-full block">
                      <Glass className="p-3.5 flex items-center justify-between hover:bg-white/12 transition cursor-pointer">
                        <div className="flex items-center gap-3">{icon}<div><div className="text-sm font-semibold text-white">{label}</div><div className="text-[10px] text-slate-400">{sub}</div></div></div>
                        <ChevronRight size={15}className="text-slate-500"/>
                      </Glass>
                    </button>
                  ))}
                </div>
                <button onClick={resetGame}className="w-full py-2 text-xs text-slate-500 hover:text-slate-400 flex items-center justify-center gap-1.5 transition"><RotateCcw size={11}/>Mulai Ulang Karir</button>
                <p className="text-center text-[10px] text-slate-600 mt-1">🐛 Bug & saran? <a href="https://instagram.com/arrazynur" target="_blank" className="text-blue-500 hover:text-blue-400 underline">@arrazynur</a></p>
              </motion.div>
            )}

            {/* PREVIEW */}
            {screen==='preview'&&(
              <motion.div key="preview"initial={{opacity:0,x:30}}animate={{opacity:1,x:0}}exit={{opacity:0,x:-30}}transition={{duration:0.3}}className="space-y-3">
                <button onClick={()=>nav('home')}className="text-sm text-blue-400 hover:text-blue-300">← Kembali</button>
                <Glass className="p-5 relative overflow-hidden"style={{borderTopColor:opp.color,borderTopWidth:4,borderTopStyle:'solid'}}>
                  {opp.isDerby&&<div className="absolute top-3 right-3 bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Swords size={10}/>DERBY!</div>}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"style={{backgroundColor:opp.color+'30',border:`2px solid ${opp.color}60`}}><Target className="text-white" size={28}/></div>
                    <div><h2 className="text-xl font-black text-white">{opp.name}</h2><div className="text-xs text-slate-400">{opp.formation} · OVR {opp.ovr} · {opp.isAway?'Away':'Kandang'}</div><div className="flex gap-1 mt-1.5">{opp.recentForm.map((r,i)=><div key={i}className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${r==='W'?'bg-green-500/30 text-green-400':r==='D'?'bg-amber-500/30 text-amber-400':'bg-red-500/30 text-red-400'}`}>{r}</div>)}</div></div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[{l:'GK',v:Math.round(opp.def*0.9)},{l:'DEF',v:Math.round(opp.def)},{l:'MID',v:Math.round(opp.mid)},{l:'ATK',v:Math.round(opp.atk)}].map(({l,v})=>(
                      <div key={l}className="bg-white/5 rounded-lg p-2 text-center"><div className={`text-[10px] font-black mb-0.5 ${l==='ATK'?'text-red-400':l==='DEF'?'text-blue-400':l==='MID'?'text-emerald-400':'text-amber-400'}`}>{l}</div><div className="text-sm font-black text-white">{v}</div></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-3"><div className="text-[10px] text-green-400 font-bold mb-2 flex items-center gap-1"><TrendingUp size={10}/>KEKUATAN</div>{opp.strengths.map((s,i)=><p key={i}className="text-[10px] text-slate-300 mb-1 leading-tight">• {s}</p>)}</div>
                    <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3"><div className="text-[10px] text-red-400 font-bold mb-2 flex items-center gap-1"><TrendingDown size={10}/>KELEMAHAN</div>{opp.weaknesses.map((w,i)=><p key={i}className="text-[10px] text-slate-300 mb-1 leading-tight">• {w}</p>)}</div>
                  </div>
                  <div className="mb-4"><div className="text-[10px] text-amber-400 font-bold mb-2 flex items-center gap-1"><AlertTriangle size={10}/>PEMAIN BERBAHAYA</div><div className="flex gap-2 flex-wrap">{opp.dangerPlayers.map((p,i)=><span key={i}className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] px-2.5 py-1 rounded-full">{p}</span>)}</div></div>
                  <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3"><div className="text-[10px] text-blue-400 font-bold mb-1 flex items-center gap-1"><Sparkles size={10}/>SARAN TAKTIK</div><p className="text-xs text-slate-200 leading-relaxed">{opp.tacticalTip}</p></div>
                </Glass>
                {opp.squad&&<Glass className="p-4"><div className="text-[10px] text-slate-400 font-bold tracking-widest mb-3 flex items-center gap-1.5"><Users size={11}/>SQUAD UNGGULAN LAWAN</div><div className="space-y-2">{opp.squad.map((p,i)=><div key={i}className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl"><span className={`text-[10px] font-black w-6 text-center ${posColor(p.pos)}`}>{p.pos}</span><span className="text-sm font-medium text-white flex-1">{p.name}</span><span className="text-amber-400 text-xs font-bold flex items-center gap-0.5"><Star size={10}/>{p.rating}</span></div>)}</div></Glass>}
                {/* Lineup editor in preview */}
                <Glass className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest">LINEUP ({starters.length}/11)</div>
                    <div className="flex gap-1.5">
                      <button onClick={autoFill}className="text-[10px] bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-lg hover:bg-slate-600/50 transition flex items-center gap-1"><Sparkles size={9}/>Auto</button>
                      <button onClick={smartFill}className="text-[10px] bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg hover:bg-blue-500/30 transition flex items-center gap-1"><Zap size={9}/>Smart Fit</button>
                    </div>
                  </div>
                  <FormationPitch formation={formation}squad={squad}onSquadChange={setSquad}/>
                </Glass>
                <button onClick={startMatch}disabled={!isValid}className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${isValid?'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20':'bg-slate-700/50 text-slate-500 cursor-not-allowed'}`}>
                  <Play size={16}fill="currentColor"/>MULAI PERTANDINGAN
                </button>
              </motion.div>
            )}

            {/* TACTICS */}
            {screen==='tactics'&&(
              <motion.div key="tactics"initial={{opacity:0,x:30}}animate={{opacity:1,x:0}}exit={{opacity:0,x:-30}}transition={{duration:0.3}}className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <button onClick={()=>nav('home')}className="text-sm text-blue-400 hover:text-blue-300">← Kembali</button>
                  <div className="flex gap-1.5">
                    <button onClick={autoFill}className="text-xs bg-slate-700/50 text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-slate-600/50 transition"><Sparkles size={11}/>Auto</button>
                    <button onClick={smartFill}className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-blue-500/30 transition"><Zap size={11}/>Smart Fit</button>
                  </div>
                </div>
                {/* Formation */}
                <Glass className="p-4">
                  <div className="text-[10px] text-slate-400 font-semibold tracking-widest mb-3">PILIH FORMASI</div>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {(Object.keys(FORMATIONS)as Formation[]).map(f=><button key={f}onClick={()=>{setFormation(f);if(soundOn)playClick();}}className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${formation===f?'bg-blue-600 text-white shadow-lg shadow-blue-500/20':'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'}`}>{f}</button>)}
                  </div>
                  <div className="text-[10px] text-slate-500">{FORMATIONS[formation].desc}</div>
                  <div className="flex gap-4 mt-1.5 text-[10px]">{[['ATK',FORMATIONS[formation].bonus.atk],['DEF',FORMATIONS[formation].bonus.def],['MID',FORMATIONS[formation].bonus.mid]].map(([k,v])=><span key={k}className={+v>0?'text-green-400':+v<0?'text-red-400':'text-slate-500'}>{k}: {+v>0?'+':''}{v}</span>)}</div>
                </Glass>
                {/* Pitch with swap mode */}
                <Glass className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[10px] text-slate-400 font-semibold tracking-widest">LINEUP ({starters.length}/11)</div>
                  </div>
                  <FormationPitch formation={formation}squad={squad}onSquadChange={setSquad}/>
                  <p className="text-[9px] text-slate-500 text-center mt-2">Tap bench → tap slot. Tap pemain lapangan → swap posisi.</p>
                </Glass>
                {/* Tactic & Intensity */}
                <Glass className="p-4">
                  <div className="text-[10px] text-slate-400 font-semibold tracking-widest mb-3">FILOSOFI & INTENSITAS</div>
                  <div className="flex gap-2 mb-2">{(['Menyerang','Seimbang','Bertahan']as const).map(t=><button key={t}onClick={()=>{setTactic(t);if(soundOn)playClick();}}className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${tactic===t?'bg-blue-600 text-white':'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'}`}>{t}</button>)}</div>
                  <div className="text-[10px] text-slate-500 mb-3">{tactic==='Menyerang'?'ATK +3, DEF -2':tactic==='Bertahan'?'DEF +3, ATK -2':'Pendekatan seimbang'}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mb-2">INTENSITAS PERMAINAN</div>
                  <div className="flex gap-2">{(['Lembut','Sedang','Kasar']as const).map(t=>(
                    <button key={t}onClick={()=>{setIntensity(t);if(soundOn)playClick();}}className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${intensity===t?'bg-orange-600 text-white':'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'}`}>{INTENSITY_LABELS[t]}</button>
                  ))}</div>
                  <div className="text-[10px] text-slate-500 mt-2">{intensity==='Kasar'?'⚠️ Foul & kartu kuning lebih sering, cedera lebih tinggi':intensity==='Lembut'?'Bermain sportif, foul minimal':'Intensitas normal'}</div>
                </Glass>
                {/* Squad */}
                <Glass className="p-4">
                  <div className="text-[10px] text-slate-400 font-semibold tracking-widest mb-3">SKUAD ({squad.length} pemain)</div>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {[...squad].sort((a,b)=>Number(b.starter)-Number(a.starter)||b.rating-a.rating).map(p=>{
                      const fit=Math.round((p.form/100*0.5+p.stamina/100*0.5)*100);
                      return(
                        <motion.div key={p.id}whileTap={{scale:0.98}}onClick={()=>toggleStarter(p)}
                          className={`p-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer border transition ${p.starter?'bg-blue-600/12 border-blue-500/35':'bg-slate-800/40 border-transparent hover:bg-slate-700/40 opacity-60'} ${(p.injured||p.redCard)?'opacity-20 cursor-not-allowed':''}`}>
                          <span className={`text-[10px] font-black w-7 text-center ${posColor(p.pos)}`}>{p.posInd.split(' ')[0]}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-1"><div className="w-8 h-1 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${fit>80?'bg-green-500':fit>60?'bg-amber-500':'bg-red-500'}`}style={{width:`${fit}%`}}/></div><span className="text-[9px] text-slate-500">{fit}%</span></div>
                              <span className="text-[9px] text-slate-500">{p.nationality.substring(0,3).toUpperCase()}</span>
                              {p.injured&&<span className="text-[9px] text-red-400 font-bold">🚑{p.injuryWeeks}w</span>}
                              {p.suspended&&<span className="text-[9px] text-purple-400 font-bold">🚫SUSPENSI</span>}
                              {!p.injured&&!p.suspended&&(()=>{const c=getCondition(p);return c.formPenalty>0?<span className={`text-[9px] font-bold ${c.color}`}>{c.label}</span>:null;})()}
                              {p.yellowCards>=4&&<span className="text-[9px] text-yellow-400">🟨{p.yellowCards}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="flex items-center gap-0.5">
                                <span className="text-xs font-bold text-amber-400">{p.rating}</span>
                                {p.rating>p.baseRating&&<span className="text-[8px] text-green-400 font-bold">↑</span>}
                                {p.rating<p.baseRating&&<span className="text-[8px] text-red-400 font-bold">↓</span>}
                              </div>
                              <div className="text-[8px] text-slate-500">{p.age}y</div>
                            </div>
                            <div className={`w-2.5 h-2.5 rounded-full ${p.starter?'bg-blue-400 shadow-[0_0_6px_#60a5fa]':'bg-slate-600'}`}/>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </Glass>
              </motion.div>
            )}

            {/* MARKET */}
            {screen==='market'&&(
              <motion.div key="market"initial={{opacity:0,x:30}}animate={{opacity:1,x:0}}exit={{opacity:0,x:-30}}transition={{duration:0.3}}className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <button onClick={()=>nav('home')}className="text-sm text-blue-400 hover:text-blue-300">← Kembali</button>
                  <span className="text-emerald-400 font-bold text-sm flex items-center gap-0.5"><DollarSign size={13}/>Budget: {budget.toFixed(1)}M</span>
                </div>
                {bench.length>0&&(
                  <Glass className="p-4">
                    <div className="text-[10px] text-slate-400 font-semibold tracking-widest mb-3">JUAL PEMAIN (−20%) — tap untuk pilih alasan</div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {bench.map(p=>(
                        <div key={p.id}onClick={()=>setSellTarget(p)}className="flex-shrink-0 w-24 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-red-500/50 cursor-pointer transition">
                          <div className="text-[10px] font-bold text-white truncate">{p.name.split(' ')[0]}</div>
                          <div className="text-[9px] text-slate-400">{p.pos} · {p.rating}</div>
                          <div className="text-[10px] text-emerald-400 font-bold mt-1">+{(p.price*0.8).toFixed(1)}M</div>
                        </div>
                      ))}
                    </div>
                  </Glass>
                )}
                <div className="flex gap-2">{['ALL','GK','DF','MF','FW'].map(f=><button key={f}onClick={()=>setMarketFilter(f)}className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${marketFilter===f?'bg-blue-600 text-white':'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'}`}>{f}</button>)}</div>
                <Glass className="p-4">
                  <div className="text-[10px] text-slate-400 font-semibold tracking-widest mb-3">BURSA TRANSFER ({filteredMarket.length})</div>
                  <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                    {filteredMarket.map(p=>(
                      <div key={p.id}onClick={()=>budget>=p.price&&confirmBuy(p)}className={`p-3 rounded-xl flex items-center gap-3 border transition ${budget>=p.price?'bg-slate-800/40 border-slate-700/40 hover:border-blue-500/40 cursor-pointer':'bg-slate-900/30 border-slate-800/30 opacity-40'}`}>
                        <span className={`text-[10px] font-black w-7 text-center ${posColor(p.pos)}`}>{p.pos}</span>
                        <div className="flex-1 min-w-0"><div className="text-xs font-semibold text-white truncate">{p.name}</div><div className="text-[10px] text-slate-400 truncate">{p.club} · {p.nationality}</div></div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-bold text-amber-400 flex items-center gap-0.5 justify-end"><Star size={10}/>{p.rating}</div>
                          <div className={`text-xs font-bold ${budget>=p.price?'text-emerald-400':'text-red-400'}`}>{p.price}M</div>
                        </div>
                        {budget>=p.price&&<ShoppingCart size={14}className="text-blue-400 flex-shrink-0"/>}
                      </div>
                    ))}
                  </div>
                </Glass>
              </motion.div>
            )}

            {/* STATS */}
            {screen==='stats'&&(()=>{
              const[statsTab,setStatsTab]=React.useState<'klasemen'|'performa'|'scorer'>('klasemen');
              return(
              <motion.div key="stats"initial={{opacity:0,x:30}}animate={{opacity:1,x:0}}exit={{opacity:0,x:-30}}transition={{duration:0.3}}className="space-y-3">
                <button onClick={()=>nav('home')}className="text-sm text-blue-400 hover:text-blue-300">← Kembali</button>
                {/* Tab selector */}
                <div className="flex gap-2">
                  {[{id:'klasemen',label:'📊 Klasemen'},{id:'performa',label:'👥 Performa'},{id:'scorer',label:'⚽ Scorer'}].map(t=>(
                    <button key={t.id} onClick={()=>setStatsTab(t.id as typeof statsTab)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${statsTab===t.id?'bg-blue-600 text-white':'bg-white/8 text-slate-400 hover:bg-white/12'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {statsTab==='klasemen'&&(
                  <Glass className="p-4">
                  <div className="text-[10px] text-amber-400 font-bold tracking-widest mb-3 flex items-center gap-1.5"><Trophy size={12}/>KLASEMEN BRI SUPER LEAGUE 2025/26</div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold px-2 mb-1.5">
                    <div className="w-5 flex-shrink-0">#</div><div className="flex-1 min-w-0">KLUB</div>
                    <div className="w-6 text-center flex-shrink-0">M</div><div className="w-6 text-center flex-shrink-0 text-green-400">W</div><div className="w-6 text-center flex-shrink-0 text-amber-400">D</div><div className="w-6 text-center flex-shrink-0 text-red-400">L</div>
                    <div className="w-8 text-center flex-shrink-0">SG</div><div className="w-7 text-center flex-shrink-0 font-bold text-white">P</div>
                  </div>
                  <div className="space-y-0.5 max-h-72 overflow-y-auto">
                    {sortedStandings.map((t,idx)=>{
                      const isPersib=t.name==='Persib Bandung';const gd=t.gf-t.ga;
                      const rc=isPersib?'bg-blue-500/15 border border-blue-500/25':idx===0?'bg-amber-400/8 border-l-2 border-l-amber-400':idx<3?'bg-emerald-500/5 border-l-2 border-l-emerald-500':idx>=sortedStandings.length-3?'bg-red-500/5 border-l-2 border-l-red-500':'bg-white/3';
                      return(
                        <div key={t.name}className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs ${rc}`}>
                          <div className="w-5 flex-shrink-0 text-[9px] font-bold text-slate-400">{idx+1}</div>
                          <div className="flex-1 min-w-0 flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0"style={{backgroundColor:t.color}}/><span className={`truncate font-medium text-[10px] ${isPersib?'text-blue-300 font-bold':idx<3?'text-white':'text-white/70'}`}>{t.name.replace(' Bandung','').replace(' Jakarta','').replace(' Makassar','').replace(' United','').replace(' Kediri','').replace(' Solo','').replace(' Jepara','')}</span></div>
                          <div className="w-6 text-center text-[9px] text-slate-400 flex-shrink-0">{t.played}</div>
                          <div className="w-6 text-center text-[9px] text-green-400 flex-shrink-0">{t.won}</div>
                          <div className="w-6 text-center text-[9px] text-amber-400 flex-shrink-0">{t.draw}</div>
                          <div className="w-6 text-center text-[9px] text-red-400 flex-shrink-0">{t.lost}</div>
                          <div className={`w-8 text-center text-[9px] flex-shrink-0 ${gd>0?'text-green-400':gd<0?'text-red-400':'text-slate-400'}`}>{gd>0?'+':''}{gd}</div>
                          <div className="w-7 text-center text-[10px] font-black text-white flex-shrink-0">{t.points}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/40 flex gap-4 text-[9px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-sm inline-block"/>Juara</span><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-sm inline-block"/>Asia</span><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-sm inline-block"/>Degradasi</span>
                  </div>
                </Glass>
                )}
                {statsTab==='scorer'&&(<>
                  <Glass className="p-4">
                  <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-3 flex items-center gap-1.5"><Award size={12}className="text-amber-400"/>TOP SCORER</div>
                  {topScorers.length===0?<p className="text-xs text-slate-500 text-center py-2">Belum ada gol</p>:<div className="space-y-1.5">{topScorers.slice(0,10).map((p,i)=><div key={p.id}className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-slate-800/30"><span className={`text-sm font-black w-5 text-center ${i===0?'text-amber-400':i===1?'text-slate-300':i===2?'text-amber-700':'text-slate-500'}`}>{i+1}</span><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${posBg(p.pos)} ${posColor(p.pos)}`}>{p.pos}</div><div className="flex-1"><div className="text-xs font-semibold text-white">{p.name}</div><div className="text-[9px] text-slate-400">{p.posInd} · {p.matchesPlayed} laga</div></div><div className="text-right"><div className="text-lg font-black text-amber-400 leading-none">{p.goals}</div><div className="text-[9px] text-slate-500">gol</div></div></div>)}</div>}
                  </Glass>
                  <Glass className="p-4">
                  <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-3 flex items-center gap-1.5"><Zap size={12}className="text-blue-400"/>TOP ASSIST</div>
                  {topAssists.length===0?<p className="text-xs text-slate-500 text-center py-2">Belum ada assist</p>:<div className="space-y-1.5">{topAssists.slice(0,10).map((p,i)=><div key={p.id}className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-slate-800/30"><span className={`text-sm font-black w-5 text-center ${i===0?'text-blue-400':i===1?'text-slate-300':i===2?'text-blue-700':'text-slate-500'}`}>{i+1}</span><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${posBg(p.pos)} ${posColor(p.pos)}`}>{p.pos}</div><div className="flex-1"><div className="text-xs font-semibold text-white">{p.name}</div><div className="text-[9px] text-slate-400">{p.posInd}</div></div><div className="text-right"><div className="text-lg font-black text-blue-400 leading-none">{p.assists}</div><div className="text-[9px] text-slate-500">assist</div></div></div>)}</div>}
                  </Glass>
                </>)}
                {statsTab==='performa'&&(
                  <Glass className="p-4">
                    <div className="text-[10px] text-purple-400 font-bold tracking-widest mb-3 flex items-center gap-1.5"><Activity size={12}className="text-purple-400"/>PERFORMA PEMAIN MUSIM INI</div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold px-1 mb-2">
                      <div className="flex-1 min-w-0">NAMA</div>
                      <div className="w-8 text-center">⚽</div>
                      <div className="w-8 text-center">🎯</div>
                      <div className="w-8 text-center">M</div>
                      <div className="w-8 text-center text-amber-400">OVR</div>
                    </div>
                    <div className="space-y-1 max-h-[55vh] overflow-y-auto">
                      {[...squad].sort((a,b)=>b.rating-a.rating).map(p=>{
                        const fit=Math.round((p.form/100*0.5+p.stamina/100*0.5)*100);
                        const cond=getCondition(p);
                        return(
                          <div key={p.id} className="flex items-center gap-1.5 px-2 py-2 rounded-xl bg-white/4 hover:bg-white/6 transition">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 ${posBg(p.pos)} ${posColor(p.pos)}`}>{p.pos}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-semibold text-white truncate">{p.name}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${fit}%`,background:cond.dot}}/></div>
                                <span className={`text-[8px] font-semibold ${cond.color}`}>{cond.label}</span>
                              </div>
                            </div>
                            <div className="w-8 text-center text-[10px] font-bold text-blue-400">{p.goals||'—'}</div>
                            <div className="w-8 text-center text-[10px] font-bold text-emerald-400">{p.assists||'—'}</div>
                            <div className="w-8 text-center text-[10px] text-slate-400">{p.matchesPlayed}</div>
                            <div className="w-8 text-center">
                              <span className="text-[10px] font-black text-amber-400">{p.rating}</span>
                              {p.rating>p.baseRating&&<span className="text-[8px] text-green-400">↑</span>}
                              {p.rating<p.baseRating&&<span className="text-[8px] text-red-400">↓</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Glass>
                )}
              </motion.div>
            );})()}

            {/* MATCH */}
            {screen==='match'&&(
              <motion.div key="match"initial={{opacity:0,scale:0.97}}animate={{opacity:1,scale:1}}className="flex flex-col gap-3">
                <Glass className="p-4 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/><span className="text-[10px] text-red-400 font-bold tracking-widest">LIVE</span>{expelledIds.size>0&&<span className="text-[9px] text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">{11-expelledIds.size} pemain</span>}</div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={()=>setIsPaused(!isPaused)}className={`px-2 py-1 text-[10px] rounded-lg font-semibold transition ${isPaused?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}`}>{isPaused?'▶ Lanjut':'⏸ Pause'}</button>
                      <button onClick={()=>setSpeed(s=>s===1?2:s===2?4:1)}className="px-2 py-1 text-[10px] rounded-lg bg-blue-500/20 text-blue-400 font-semibold flex items-center gap-1"><FastForward size={9}/>{speed}x</button>
                    </div>
                  </div>
                  <div className="text-center mb-2">
                    <div className="text-5xl font-black text-white tracking-tighter tabular-nums">{matchMin}'</div>
                    <div className="w-full h-1 bg-slate-700/60 rounded-full mt-2 overflow-hidden"><motion.div animate={{width:`${Math.min(100,(matchMin/90)*100)}%`}}className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"/></div>
                  </div>
                  <div className="flex justify-around items-center mb-3">
                    <div className="text-center"><div className="w-10 h-10 mx-auto mb-1 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 border-2 border-amber-400 flex items-center justify-center"><Shield size={16}className="text-white"/></div><div className="text-[9px] text-slate-400 mb-0.5">PERSIB</div><motion.div key={score.p}initial={{scale:1.6}}animate={{scale:1}}className="text-5xl font-black text-blue-400 tabular-nums">{score.p}</motion.div></div>
                    <div className="text-slate-600 font-black text-3xl pb-4">—</div>
                    <div className="text-center"><div className="w-10 h-10 mx-auto mb-1 rounded-full border-2 flex items-center justify-center"style={{backgroundColor:opp.color+'22',borderColor:opp.color+'60'}}><Target size={16}className="text-white"/></div><div className="text-[9px] text-slate-400 mb-0.5 truncate max-w-[80px]">{opp.name.split(' ')[0].toUpperCase()}</div><motion.div key={score.o}initial={{scale:1.6}}animate={{scale:1}}className="text-5xl font-black text-white tabular-nums">{score.o}</motion.div></div>
                  </div>
                  <div className="border-t border-white/8 pt-2.5">
                    <div className="flex justify-between text-[9px] text-slate-500 mb-1"><span className="font-bold text-blue-400">{Math.min(100,Math.max(0,liveStats.possession))}%</span><span>PENGUASAAN</span><span className="font-bold text-slate-400">{Math.min(100,Math.max(0,100-liveStats.possession))}%</span></div>
                    <div className="h-1 bg-slate-700/60 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all duration-1000"style={{width:`${Math.min(100,Math.max(0,liveStats.possession))}%`}}/></div>
                    <div className="flex justify-between mt-2 text-[9px] text-slate-400"><span>⚽{liveStats.shotsP} shots · 🟨{liveStats.yellowsP}</span><span>{liveStats.shotsO||0} shots ⚽</span></div>
                  </div>
                </Glass>
                {/* Controls */}
                <div className="flex gap-2">
                  <button onClick={()=>{setShowTacticPanel(!showTacticPanel);setShowSubPanel(false);if(!isPaused)setIsPaused(true);}}className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${showTacticPanel?'bg-blue-600/30 border-blue-500/50 text-blue-300':'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'}`}><Settings size={13}/>Taktik</button>
                  <button onClick={()=>{setShowSubPanel(!showSubPanel);setShowTacticPanel(false);if(!isPaused)setIsPaused(true);}}disabled={subsLeft<=0}className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${showSubPanel?'bg-orange-600/30 border-orange-500/50 text-orange-300':'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50'} ${subsLeft<=0?'opacity-40 cursor-not-allowed':''}`}><RefreshCw size={13}/>Sub ({subsLeft})</button>
                  <button onClick={handleCoachAdvice}disabled={coachAdviceLeft<=0}className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${coachAdviceLeft>0?'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30':'bg-slate-800/30 border-slate-700/30 text-slate-600 cursor-not-allowed'}`}>🧠 Saran ({coachAdviceLeft})</button>
                </div>
                <AnimatePresence>
                  {showTacticPanel&&(
                    <motion.div initial={{height:0,opacity:0}}animate={{height:'auto',opacity:1}}exit={{height:0,opacity:0}}>
                      <Glass className="p-4 overflow-hidden">
                        <div className="text-[10px] text-blue-400 font-bold tracking-widest mb-3">UBAH TAKTIK</div>
                        <div className="mb-3"><div className="text-[10px] text-slate-400 mb-1.5">Formasi</div><div className="flex gap-1.5 flex-wrap">{(Object.keys(FORMATIONS)as Formation[]).map(f=><button key={f}onClick={()=>setMatchFormation(f)}className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${matchFormation===f?'bg-blue-600 text-white':'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'}`}>{f}</button>)}</div></div>
                        <div className="mb-3"><div className="text-[10px] text-slate-400 mb-1.5">Taktik</div><div className="flex gap-2">{(['Menyerang','Seimbang','Bertahan']as const).map(t=><button key={t}onClick={()=>setMatchTactic(t)}className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${matchTactic===t?'bg-blue-600 text-white':'bg-slate-800/60 text-slate-400'}`}>{t}</button>)}</div></div>
                        <div><div className="text-[10px] text-slate-400 mb-1.5">Intensitas</div><div className="flex gap-2">{(['Lembut','Sedang','Kasar']as const).map(t=><button key={t}onClick={()=>setMatchIntensity(t)}className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${matchIntensity===t?'bg-orange-600 text-white':'bg-slate-800/60 text-slate-400'}`}>{t}</button>)}</div></div>
                        <button onClick={()=>{
                          liveMatchRef.current.tactic=matchTactic;
                          liveMatchRef.current.intensity=matchIntensity;
                          liveMatchRef.current.formation=matchFormation;
                          setMatchLogs(prev=>[...prev,{text:`⚙️ ${stateRef.current.min}' TAKTIK BERUBAH: ${matchFormation} | ${matchTactic} | ${matchIntensity} — efektif sekarang!`,type:'sub',minute:stateRef.current.min}]);
                          setShowTacticPanel(false);setIsPaused(false);
                        }}className="w-full mt-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-semibold hover:bg-blue-500/30 transition">Terapkan & Lanjutkan ▶</button>
                      </Glass>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {showSubPanel&&(
                    <motion.div initial={{height:0,opacity:0}}animate={{height:'auto',opacity:1}}exit={{height:0,opacity:0}}>
                      <Glass className="p-4 overflow-hidden">
                        <div className="text-[10px] text-orange-400 font-bold tracking-widest mb-3 flex items-center gap-1.5"><RefreshCw size={11}/>SUBSTITUSI — {subsLeft} tersisa</div>
                        {!subSelectOut?(
                          <><div className="text-[10px] text-slate-400 mb-2">Pilih pemain KELUAR:</div>
                          <div className="space-y-1 max-h-36 overflow-y-auto">
                            {(matchSquad.length?matchSquad:squad).filter(p=>p.starter&&!stateRef.current.expelled.has(p.id)).map(p=>(
                              <button key={p.id}onClick={()=>setSubSelectOut(p)}className="w-full p-2 rounded-lg bg-slate-800/50 hover:bg-red-500/15 text-left text-xs flex justify-between items-center transition">
                                <span className="text-white">{p.name}</span>
                                <div className="flex items-center gap-2"><div className="w-8 h-1 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${p.form>80?'bg-green-500':p.form>60?'bg-amber-500':'bg-red-500'}`}style={{width:`${p.form}%`}}/></div><span className={`text-[10px] font-bold ${posColor(p.pos)}`}>{p.pos}</span></div>
                              </button>
                            ))}
                          </div></>
                        ):(
                          <><div className="text-[10px] text-slate-400 mb-1">Keluar: <span className="text-red-400 font-semibold">{subSelectOut.name}</span> <span className={`${posColor(subSelectOut.pos)} font-bold`}>({subSelectOut.pos})</span></div>
                          <div className="text-[10px] text-slate-400 mb-2">Pilih pemain MASUK:</div>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {(matchSquad.length?matchSquad:squad)
                              .filter(p=>!p.starter&&!p.injured&&!stateRef.current.expelled.has(p.id))
                              .sort((a,b)=>{
                                // Same position first, then by rating
                                const aPosMatch=a.pos===subSelectOut.pos?0:1;
                                const bPosMatch=b.pos===subSelectOut.pos?0:1;
                                return aPosMatch-bPosMatch||b.rating-a.rating;
                              })
                              .map(p=>{
                                const samePos=p.pos===subSelectOut.pos;
                                return(
                                  <button key={p.id}onClick={()=>makeSub(subSelectOut,p)}
                                    className={`w-full p-2 rounded-lg text-left text-xs flex justify-between items-center transition ${samePos?'bg-green-500/10 hover:bg-green-500/20 border border-green-500/20':'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent'}`}>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-black ${posColor(p.pos)}`}>{p.pos}</span>
                                      <span className="text-white">{p.name}</span>
                                      {samePos&&<span className="text-[9px] text-green-400">✓ Sesuai</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-8 h-1 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${p.form>80?'bg-green-500':p.form>60?'bg-amber-500':'bg-red-500'}`}style={{width:`${p.form}%`}}/></div>
                                      <span className="text-amber-400 text-[10px] font-bold">{p.rating}</span>
                                    </div>
                                  </button>
                                );
                              })
                            }
                            {!(matchSquad.length?matchSquad:squad).filter(p=>!p.starter&&!p.injured).length&&
                              <p className="text-xs text-slate-500 text-center py-2">Tidak ada pemain tersedia di bangku</p>}
                          </div>
                          <button onClick={()=>setSubSelectOut(null)}className="w-full mt-2 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 text-xs">← Pilih ulang</button></>
                        )}
                        <button onClick={()=>{setShowSubPanel(false);setIsPaused(false);}}className="w-full mt-2 py-2 rounded-lg bg-slate-700/40 text-slate-400 text-xs hover:bg-slate-600/40 transition">Tutup & Lanjutkan ▶</button>
                      </Glass>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Glass className="p-3">
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {matchLogs.map((log,i)=>(
                      <motion.div key={i}initial={{opacity:0,x:-10}}animate={{opacity:1,x:0}}
                        className={`px-3 py-2 rounded-lg text-xs leading-relaxed border-l-2 ${log.type==='goal-p'?'border-blue-400 bg-blue-500/12 text-blue-100 font-semibold':log.type==='goal-o'?'border-red-500 bg-red-500/12 text-red-100 font-semibold':log.type==='halftime'?'border-amber-500 bg-amber-500/10 text-amber-200 font-semibold text-center':log.type==='fulltime'?'border-green-500 bg-green-500/10 text-green-200 font-bold text-center':log.type==='sub'?'border-cyan-500 bg-cyan-500/10 text-cyan-200':log.type==='card'?'border-yellow-500 bg-yellow-500/10 text-yellow-200':log.type==='red'?'border-red-600 bg-red-600/15 text-red-200 font-bold':log.type==='injury'?'border-orange-500 bg-orange-500/10 text-orange-200':log.type==='decision'?'border-purple-500 bg-purple-500/10 text-purple-200':log.type==='chance'?'border-orange-500 bg-orange-500/8 text-orange-200':'border-slate-700/50 text-slate-400'}`}>
                        {log.text}
                      </motion.div>
                    ))}
                    {isRunning&&!isPaused&&<div className="flex items-center gap-2 px-3 py-1 text-xs text-slate-500 italic"><div className="flex gap-1">{[0,1,2].map(i=><span key={i}className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"style={{animationDelay:`${i*150}ms`}}/>)}</div>Pertandingan berlangsung...</div>}
                    {isPaused&&!activeDecision&&<div className="text-xs text-amber-400 italic px-3">⏸ Dijeda</div>}
                    <div ref={logsRef}/>
                  </div>
                </Glass>
              </motion.div>
            )}

            {/* ── MATCHWEEK RESULTS ── */}
            {screen==='matchweek-results'&&(
              <motion.div key="mwr" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="space-y-3">
                <Glass className="p-4 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600"/>
                  <div className="text-[10px] text-amber-400 font-black tracking-widest mb-1">MATCHWEEK {week}/17 SELESAI</div>
                  <div className="text-base font-black text-white mb-1">Hasil Laga Serentak</div>
                  <div className="text-[10px] text-slate-400">Semua 18 tim telah bermain hari ini</div>
                </Glass>

                {/* Persib result */}
                {matchHistory.length>0&&(()=>{
                  const last=matchHistory[matchHistory.length-1];
                  const [ps,os]=last.score.split('-').map(Number);
                  return(
                    <Glass className={`p-4 border-l-4 ${last.res==='M'?'border-l-green-500':last.res==='S'?'border-l-amber-500':'border-l-red-500'}`}>
                      <div className="text-[10px] text-slate-400 mb-1 font-semibold">🔵 HASIL PERSIB</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-white">Persib Bandung</div>
                        <div className={`text-2xl font-black px-4 ${last.res==='M'?'text-green-400':last.res==='S'?'text-amber-400':'text-red-400'}`}>{last.score}</div>
                        <div className="text-sm font-bold text-white text-right truncate max-w-[120px]">{last.opp}</div>
                      </div>
                      <div className={`text-xs font-bold mt-1 ${last.res==='M'?'text-green-400':last.res==='S'?'text-amber-400':'text-red-400'}`}>
                        {last.res==='M'?'✅ MENANG +3 poin':last.res==='S'?'➖ SERI +1 poin':'❌ KALAH +0 poin'}
                      </div>
                      {streak>=3&&<div className="text-[10px] text-amber-400 mt-1">🔥 Streak {streak} kemenangan beruntun!</div>}
                      {streak<=-3&&<div className="text-[10px] text-red-400 mt-1">💔 {Math.abs(streak)} kekalahan beruntun — tim butuh motivasi!</div>}
                    </Glass>
                  );
                })()}

                {/* All other results */}
                {matchweekResults&&(
                  <Glass className="p-4">
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-3">HASIL LAGA LAIN</div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {matchweekResults.map((r,i)=>{
                        const homeWin=r.hs>r.as,awayWin=r.as>r.hs,draw=r.hs===r.as;
                        return(
                          <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/4">
                            <div className={`flex-1 text-[10px] truncate font-medium ${homeWin?'text-white':'text-white/60'}`}>{r.home}</div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className={`text-sm font-black ${homeWin?'text-green-400':'text-white/60'}`}>{r.hs}</span>
                              <span className="text-[10px] text-slate-500">—</span>
                              <span className={`text-sm font-black ${awayWin?'text-green-400':'text-white/60'}`}>{r.as}</span>
                            </div>
                            <div className={`flex-1 text-[10px] truncate font-medium text-right ${awayWin?'text-white':'text-white/60'}`}>{r.away}</div>
                          </div>
                        );
                      })}
                    </div>
                  </Glass>
                )}

                {/* Klasemen snapshot */}
                <Glass className="p-4">
                  <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-2">KLASEMEN TERKINI — TOP 6</div>
                  <div className="space-y-1">
                    {sortedStandings.slice(0,6).map((t,idx)=>{
                      const isPersib=t.name==='Persib Bandung';
                      return(
                        <div key={t.name} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] ${isPersib?'bg-blue-500/15 border border-blue-500/25':idx===0?'bg-amber-500/8':'bg-white/3'}`}>
                          <span className="w-4 text-slate-400 font-bold">{idx+1}</span>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:t.color}}/>
                          <span className={`flex-1 truncate font-medium ${isPersib?'text-blue-300 font-bold':'text-white/80'}`}>{t.name.replace(' Bandung','').replace(' Jakarta','').replace(' Makassar','').replace(' United','')}</span>
                          <span className="text-slate-400">{t.played}M</span>
                          <span className="font-black text-white w-6 text-right">{t.points}</span>
                        </div>
                      );
                    })}
                  </div>
                </Glass>

                <div className="flex gap-2">
                  <button onClick={()=>{setMatchSummary(null);setMatchweekResults(null);nav('home');}}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition">
                    <Home size={16}/>Lanjut ke Home
                  </button>
                  {matchSummary&&(
                    <button onClick={()=>{setScreen('matchweek-results');setMatchSummary(s=>s);}}
                      className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition border border-white/15">
                      <Activity size={14}/>Rating
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── CHAMPION PREVIEW ── */}
            {screen==='champion-preview'&&(
              <motion.div key="champ" initial={{opacity:0}} animate={{opacity:1}} className="pb-8">
                <Confetti active={true}/>
                {/* Hero */}
                <motion.div initial={{scale:0.8}} animate={{scale:1}} transition={{type:'spring',stiffness:150,damping:15}}
                  className="relative rounded-3xl overflow-hidden p-8 text-center mb-4"
                  style={{background:'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.4) 0%, rgba(15,23,42,0.97) 65%)',border:'1px solid rgba(251,191,36,0.3)'}}>
                  <motion.div initial={{scale:0,rotate:-30}} animate={{scale:1,rotate:0}} transition={{delay:0.3,type:'spring',stiffness:120,damping:10}}
                    className="text-8xl mb-4">🏆</motion.div>
                  <motion.h1 initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.5}}
                    className="text-3xl font-black text-amber-400 mb-1">PERSIB JUARA!</motion.h1>
                  <motion.p initial={{y:10,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.7}}
                    className="text-base font-bold text-white mb-2">BRI Super League 2025/26</motion.p>
                  <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.9}}
                    className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                    Coach {managerName} dari {managerRegion} berhasil membawa Maung Bandung kembali menjadi RAJA Indonesia! Bobotoh di seluruh penjuru dunia menangis bahagia! 💙
                  </motion.p>
                  <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:1.1,type:'spring'}}
                    className="mt-4 inline-block bg-amber-500/20 border border-amber-400/50 rounded-full px-6 py-2 text-amber-300 font-black text-sm">
                    🎉 HATTRICK JUARA BERUNTUN! 🎉
                  </motion.div>
                </motion.div>

                {/* Podium */}
                <Glass className="p-5 mb-3">
                  <div className="text-[10px] text-amber-400 font-bold tracking-widest mb-4 text-center">🏆 PODIUM BRI SUPER LEAGUE 2025/26</div>
                  <div className="flex items-end justify-center gap-3 mb-4">
                    {/* 2nd */}
                    {sortedStandings[1]&&<motion.div initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.4}}
                      className="flex flex-col items-center">
                      <div className="text-lg font-black text-slate-300 mb-1">🥈</div>
                      <div className="w-16 rounded-t-lg flex items-center justify-center pb-2 pt-4 font-bold text-xs text-white" style={{height:70,background:sortedStandings[1].color+'40',border:`1px solid ${sortedStandings[1].color}50`}}>
                        <div className="text-center"><div className="text-[8px] truncate max-w-[56px]">{sortedStandings[1].name.split(' ')[0]}</div><div className="text-base font-black">{sortedStandings[1].points}</div></div>
                      </div>
                    </motion.div>}
                    {/* 1st - Persib */}
                    <motion.div initial={{y:50,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.2}}
                      className="flex flex-col items-center">
                      <motion.div animate={{rotate:[0,-5,5,-5,0]}} transition={{delay:1,duration:0.5}} className="text-2xl font-black text-amber-400 mb-1">🥇</motion.div>
                      <div className="w-20 rounded-t-lg flex items-center justify-center pb-2 pt-6 font-bold text-white"
                        style={{height:90,background:'linear-gradient(to top, #d97706, #fbbf24)',boxShadow:'0 0 20px rgba(251,191,36,0.4)'}}>
                        <div className="text-center"><div className="text-[9px] font-bold">PERSIB</div><div className="text-xl font-black">{points}</div><div className="text-[8px] opacity-80">poin</div></div>
                      </div>
                    </motion.div>
                    {/* 3rd */}
                    {sortedStandings[2]&&<motion.div initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.5}}
                      className="flex flex-col items-center">
                      <div className="text-lg font-black text-amber-700 mb-1">🥉</div>
                      <div className="w-16 rounded-t-lg flex items-center justify-center pb-2 pt-3 font-bold text-xs text-white" style={{height:55,background:sortedStandings[2].color+'40',border:`1px solid ${sortedStandings[2].color}50`}}>
                        <div className="text-center"><div className="text-[8px] truncate max-w-[56px]">{sortedStandings[2].name.split(' ')[0]}</div><div className="text-base font-black">{sortedStandings[2].points}</div></div>
                      </div>
                    </motion.div>}
                  </div>
                </Glass>

                {/* Player awards */}
                <Glass className="p-4 mb-3">
                  <div className="text-[10px] text-amber-400 font-bold tracking-widest mb-3">🏅 PENGHARGAAN INDIVIDU</div>
                  <div className="space-y-2">
                    {[...squad].filter(p=>p.goals>0).sort((a,b)=>b.goals-a.goals).slice(0,1).map(p=>(
                      <div key={p.id} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                        <span className="text-2xl">⚽</span>
                        <div className="flex-1"><div className="text-[10px] text-amber-400 font-bold">TOP SCORER</div><div className="text-sm font-bold text-white">{p.name}</div></div>
                        <div className="text-2xl font-black text-amber-400">{p.goals}</div>
                      </div>
                    ))}
                    {[...squad].filter(p=>p.assists>0).sort((a,b)=>b.assists-a.assists).slice(0,1).map(p=>(
                      <div key={p.id} className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                        <span className="text-2xl">🎯</span>
                        <div className="flex-1"><div className="text-[10px] text-blue-400 font-bold">TOP ASSIST</div><div className="text-sm font-bold text-white">{p.name}</div></div>
                        <div className="text-2xl font-black text-blue-400">{[...squad].filter(p=>p.assists>0).sort((a,b)=>b.assists-a.assists)[0]?.assists}</div>
                      </div>
                    ))}
                    {[...squad].sort((a,b)=>b.rating-a.rating).slice(0,1).map(p=>(
                      <div key={p.id} className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                        <span className="text-2xl">⭐</span>
                        <div className="flex-1"><div className="text-[10px] text-purple-400 font-bold">PEMAIN TERBAIK</div><div className="text-sm font-bold text-white">{p.name}</div></div>
                        <div className="text-xl font-black text-purple-400">{p.rating}</div>
                      </div>
                    ))}
                  </div>
                </Glass>

                {/* Celebration message */}
                <Glass className="p-4 mb-4 text-center">
                  <div className="text-4xl mb-2">🔵💛🐯</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "Persib bukan sekadar klub sepak bola. Persib adalah bagian dari jiwa jutaan Bobotoh. Dan malam ini, jiwa itu berselebrasi bersama!"
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">— Special Thanks: AR RAZI NUR INSAN, Bobotoh Cimahi</p>
                </Glass>

                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setScreen('end')}
                  className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 text-slate-900 shadow-xl"
                  style={{background:'linear-gradient(135deg, #fbbf24, #f59e0b)',boxShadow:'0 8px 32px rgba(251,191,36,0.4)'}}>
                  Lihat Statistik Lengkap →
                </motion.button>
              </motion.div>
            )}

            {/* ── END SEASON ── */}
            {screen==='end'&&(()=>{
              const finalPos=sortedStandings.findIndex(t=>t.name==='Persib Bandung')+1;
              const wins=matchHistory.filter(m=>m.res==='M').length;
              const draws=matchHistory.filter(m=>m.res==='S').length;
              const losses=matchHistory.filter(m=>m.res==='K').length;
              const topScorer=[...squad].filter(p=>p.goals>0).sort((a,b)=>b.goals-a.goals)[0];
              const topAssist=[...squad].filter(p=>p.assists>0).sort((a,b)=>b.assists-a.assists)[0];
              const prevPoints=points; // already set

              // Determine scenario
              const isFired=morale<=5;
              const isChampion=finalPos===1;
              const isHattrick=isChampion; // extend later for multi-season
              const isAsia=!isChampion&&finalPos<=3;
              const isUpperMid=!isAsia&&finalPos<=6;
              const isLowerMid=!isUpperMid&&finalPos<=12;
              const isRelegation=finalPos>14;
              const isJustSurvived=!isRelegation&&!isLowerMid&&finalPos>12;

              type Scenario={emoji:string;headline:string;sub:string;color:string;glow:string;badge:string;badgeColor:string};
              const scenario:Scenario=
                isFired?{emoji:'💔',headline:'DIPECAT!',sub:`Bobotoh sudah tidak percaya padamu, Coach ${managerName}. Maaf, ini memang keputusan terbaik untuk klub.`,color:'#ef4444',glow:'rgba(239,68,68,0.3)',badge:'DIPECAT',badgeColor:'#ef4444'}:
                isChampion?{emoji:'🏆',headline:'JUARA BRI SUPER LEAGUE!',sub:`LUAR BIASA Coach ${managerName}! Maung Bandung kembali berjaya! Seluruh Bandung merayakan kemenangan ini! Persib is back!`,color:'#fbbf24',glow:'rgba(251,191,36,0.4)',badge:'JUARA 🏆',badgeColor:'#d97706'}:
                isAsia?{emoji:'⭐',headline:'LOLOS KOMPETISI ASIA!',sub:`Kerja keras terbayar, Coach ${managerName}! Persib akan berlaga di Asia musim depan. Bobotoh bangga setinggi langit!`,color:'#3b82f6',glow:'rgba(59,130,246,0.3)',badge:'KOMPETISI ASIA ✈️',badgeColor:'#1d4ed8'}:
                isUpperMid?{emoji:'👊',headline:'PAPAN ATAS LIGA!',sub:`Musim yang solid, Coach ${managerName}! Persib finish di papan atas. Fondasi bagus untuk musim depan!`,color:'#10b981',glow:'rgba(16,185,129,0.3)',badge:'PAPAN ATAS',badgeColor:'#059669'}:
                isLowerMid?{emoji:'😐',headline:'PAPAN TENGAH',sub:`Musim yang biasa-biasa saja, Coach ${managerName}. Bobotoh kecewa tapi masih percaya. Harus lebih baik musim depan!`,color:'#f59e0b',glow:'rgba(245,158,11,0.25)',badge:'PAPAN TENGAH',badgeColor:'#b45309'}:
                isJustSurvived?{emoji:'😮‍💨',headline:'SELAMAT DARI DEGRADASI!',sub:`Nyaris degradasi tapi selamat, Coach ${managerName}! Harus jauh lebih serius musim depan!`,color:'#f97316',glow:'rgba(249,115,22,0.25)',badge:'NYARIS DEGRADASI',badgeColor:'#c2410c'}:
                {emoji:'⬇️',headline:'DEGRADASI!',sub:`Persib turun kasta, Coach ${managerName}. Bobotoh menangis. Ini keputusan manajemen yang sangat berat...`,color:'#dc2626',glow:'rgba(220,38,38,0.3)',badge:'DEGRADASI',badgeColor:'#b91c1c'};

              return(
                <motion.div key="end" initial={{opacity:0}} animate={{opacity:1}} className="pb-8">
                  {/* Hero section */}
                  <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:0.1,type:'spring',stiffness:200,damping:20}}
                    className="relative rounded-3xl overflow-hidden mb-4 p-8 text-center"
                    style={{background:`radial-gradient(ellipse at 50% 0%, ${scenario.glow} 0%, rgba(15,23,42,0.95) 70%)`,border:`1px solid ${scenario.color}30`}}>
                    {/* Confetti if champion */}
                    {isChampion&&<Confetti active={true}/>}
                    {/* Background glow */}
                    <div className="absolute inset-0 pointer-events-none" style={{background:`radial-gradient(ellipse at 50% 0%, ${scenario.glow} 0%, transparent 60%)`}}/>
                    <motion.div initial={{scale:0,rotate:-20}} animate={{scale:1,rotate:0}} transition={{delay:0.3,type:'spring',stiffness:150,damping:12}}
                      className="text-7xl mb-4 relative z-10">
                      {scenario.emoji}
                    </motion.div>
                    <motion.h1 initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.5}}
                      className="text-2xl font-black mb-2 relative z-10 leading-tight"
                      style={{color:scenario.color}}>
                      {scenario.headline}
                    </motion.h1>
                    <motion.p initial={{y:10,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.7}}
                      className="text-xs text-slate-300 leading-relaxed relative z-10 max-w-xs mx-auto">
                      {scenario.sub}
                    </motion.p>
                    {/* Badge */}
                    <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.9,type:'spring'}}
                      className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-black tracking-wider relative z-10"
                      style={{background:scenario.badgeColor+'22',border:`1px solid ${scenario.badgeColor}60`,color:scenario.color}}>
                      {scenario.badge}
                    </motion.div>
                  </motion.div>

                  {/* Final standing + stats */}
                  <Glass className="p-5 mb-3">
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-3">RINGKASAN MUSIM</div>
                    {/* Big position */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/8">
                      <div>
                        <div className="text-[10px] text-slate-500">POSISI AKHIR LIGA</div>
                        <div className="text-5xl font-black" style={{color:scenario.color}}>#{finalPos}</div>
                        <div className="text-xs text-slate-400">dari 18 klub</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 mb-1">TOTAL POIN</div>
                        <div className="text-4xl font-black text-white">{prevPoints}</div>
                        <div className="text-[10px] text-slate-500 mt-1">poin musim ini</div>
                      </div>
                    </div>
                    {/* W/D/L */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[{l:'MENANG',v:wins,c:'text-green-400',bg:'bg-green-500/10'},{l:'SERI',v:draws,c:'text-amber-400',bg:'bg-amber-500/10'},{l:'KALAH',v:losses,c:'text-red-400',bg:'bg-red-500/10'}].map(({l,v,c,bg})=>(
                        <div key={l} className={`${bg} rounded-xl p-3 text-center`}>
                          <div className={`text-2xl font-black ${c}`}>{v}</div>
                          <div className="text-[9px] text-slate-500 font-semibold">{l}</div>
                        </div>
                      ))}
                    </div>
                    {/* Other stats */}
                    <div className="space-y-2">
                      {[
                        {l:'Saldo akhir',v:`${budget.toFixed(1)}M`,c:'text-emerald-400'},
                        {l:'Morale bobotoh',v:`${morale}%`,c:morale>60?'text-green-400':morale>30?'text-amber-400':'text-red-400'},
                      ].map(({l,v,c})=>(
                        <div key={l} className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-xs text-slate-400">{l}</span>
                          <span className={`text-sm font-bold ${c}`}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </Glass>

                  {/* Awards */}
                  {(topScorer||topAssist)&&(
                    <Glass className="p-4 mb-3">
                      <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-3">🏅 PENGHARGAAN PEMAIN</div>
                      <div className="space-y-2.5">
                        {topScorer&&(
                          <div className="flex items-center gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                            <div className="text-2xl">⚽</div>
                            <div className="flex-1">
                              <div className="text-[10px] text-amber-400 font-bold">TOP SCORER MUSIM INI</div>
                              <div className="text-sm font-bold text-white">{topScorer.name}</div>
                              <div className="text-[10px] text-slate-400">{topScorer.posInd}</div>
                            </div>
                            <div className="text-3xl font-black text-amber-400">{topScorer.goals}</div>
                          </div>
                        )}
                        {topAssist&&(
                          <div className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
                            <div className="text-2xl">🎯</div>
                            <div className="flex-1">
                              <div className="text-[10px] text-blue-400 font-bold">TOP ASSIST MUSIM INI</div>
                              <div className="text-sm font-bold text-white">{topAssist.name}</div>
                              <div className="text-[10px] text-slate-400">{topAssist.posInd}</div>
                            </div>
                            <div className="text-3xl font-black text-blue-400">{topAssist.assists}</div>
                          </div>
                        )}
                      </div>
                    </Glass>
                  )}

                  {/* Match history timeline */}
                  <Glass className="p-4 mb-4">
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-3">PERJALANAN MUSIM</div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchHistory.map((m,i)=>(
                        <div key={i} title={`${m.opp} ${m.score}`}
                          className={`relative group flex flex-col items-center gap-0.5 w-10 py-1.5 rounded-lg border text-[9px] font-bold transition cursor-default
                            ${m.res==='M'?'bg-green-500/15 border-green-500/30 text-green-400':m.res==='S'?'bg-amber-500/15 border-amber-500/30 text-amber-400':'bg-red-500/15 border-red-500/30 text-red-400'}`}>
                          <span className="text-[10px]">{m.res==='M'?'W':m.res==='S'?'D':'L'}</span>
                          <span style={{fontSize:7}}>{m.score}</span>
                          {/* Tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none border border-white/10 z-10">
                            {m.opp.split(' ')[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Glass>

                  {/* Special achievement banners */}
                  <div className="space-y-2 mb-4">
                    {wins>=14&&<div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"><span className="text-xl">🔥</span><div><div className="text-xs font-bold text-amber-400">DOMINAN!</div><div className="text-[10px] text-slate-400">{wins} kemenangan dari 17 laga</div></div></div>}
                    {losses===0&&<div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"><span className="text-xl">🛡️</span><div><div className="text-xs font-bold text-emerald-400">TIDAK TERKALAHKAN!</div><div className="text-[10px] text-slate-400">Tidak pernah kalah sepanjang musim</div></div></div>}
                    {topScorer&&topScorer.goals>=8&&<div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30"><span className="text-xl">👑</span><div><div className="text-xs font-bold text-blue-400">MESIN GOL!</div><div className="text-[10px] text-slate-400">{topScorer.name} cetak {topScorer.goals} gol musim ini</div></div></div>}
                    {budget>=50&&<div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30"><span className="text-xl">💰</span><div><div className="text-xs font-bold text-green-400">KAYA RAYA!</div><div className="text-[10px] text-slate-400">Saldo {budget.toFixed(1)}M di akhir musim</div></div></div>}
                  </div>

                  <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={resetGame}
                    className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition shadow-xl"
                    style={{background:`linear-gradient(135deg, ${scenario.color}, ${scenario.color}cc)`,color:'#fff',boxShadow:`0 8px 32px ${scenario.glow}`}}>
                    <RotateCcw size={18}/>MULAI KARIR BARU
                  </motion.button>
                </motion.div>
              );
            })()}

          </AnimatePresence>
        </main>

        {/* BOTTOM NAV */}
        {phase==='game'&&screen!=='match'&&(
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-3 pb-2">
            <Glass className="flex border-t border-white/10 rounded-2xl">
              {[{icon:<Home size={18}/>,label:'Home',s:'home'},{icon:<Settings size={18}/>,label:'Taktik',s:'tactics'},{icon:<ShoppingBag size={18}/>,label:'Transfer',s:'market'},{icon:<List size={18}/>,label:'Statistik',s:'stats'}].map(({icon,label,s})=>(
                <button key={s}onClick={()=>nav(s as Screen)}className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-semibold transition ${screen===s?'text-blue-400':'text-slate-500 hover:text-slate-300'}`}>
                  <div className={screen===s?'text-blue-400':'text-slate-500'}>{icon}</div>{label}
                  {screen===s&&<div className="w-1 h-1 bg-blue-400 rounded-full"/>}
                </button>
              ))}
            </Glass>
          </nav>
        )}
      </div>

      <style jsx global>{`*::-webkit-scrollbar{width:3px;height:3px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:2px}`}</style>
    </div>
  );
}
