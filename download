"use client";
import React,{useState,useEffect,useRef,useCallback}from'react';
import{motion,AnimatePresence}from'framer-motion';
import{DollarSign,Shield,Play,Trophy,Clock,MapPin,Zap,Star,Heart,Volume2,VolumeX,RotateCcw,ChevronRight,Sparkles,Target,AlertTriangle,RefreshCw,User,Eye,Swords,TrendingUp,TrendingDown,Cloud,Sun,CloudRain,Wind,BarChart2,Pause,FastForward,ShoppingCart,X,Home,Settings,ShoppingBag,List,Award,Activity,Users,ArrowLeftRight}from'lucide-react';

// ─── INTERFACES ──────────────────────────────────────────────
interface Player{
  id:number;name:string;pos:string;posInd:string;
  rating:number;price:number;nationality:string;
  starter:boolean;form:number;stamina:number;morale:number;
  yellowCards:number;// accumulative across season
  matchYellows:number;// this match (reset each game)
  redCard:boolean;injured:boolean;injuryWeeks:number;// 0=healthy, >0=weeks remaining
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
const mkP=(id:number,name:string,pos:string,posInd:string,rating:number,price:number,nat:string,starter:boolean):Player=>({
  id,name,pos,posInd,rating,price,nationality:nat,starter,form:100,stamina:100,morale:100,
  yellowCards:0,matchYellows:0,redCard:false,injured:false,injuryWeeks:0,unhappy:0,goals:0,assists:0,matchesPlayed:0
});
const INITIAL_SQUAD:Player[]=[
  mkP(1,"Teja Paku Alam","GK","Kiper",76,4.3,"Indonesia",true),
  mkP(2,"Adam Przybek","GK","Kiper",69,1.7,"Wales",false),
  mkP(3,"Fitrah Maulana","GK","Kiper",65,0.43,"Indonesia",false),
  mkP(4,"Federico Barba","DF","Bek Tengah",81,8.7,"Italia",true),
  mkP(5,"Patricio Matricardi","DF","Bek Tengah",80,7.0,"Argentina",true),
  mkP(6,"Frans Putros","DF","Bek Tengah",79,6.1,"Irak",true),
  mkP(7,"Júlio César","DF","Bek Tengah",77,5.2,"Brasil",false),
  mkP(8,"Kakang Rudianto","DF","Bek Tengah",74,3.9,"Indonesia",false),
  mkP(9,"Layvin Kurzawa","DF","Bek Kiri",85,13.0,"Prancis",true),
  mkP(10,"Dion Markx","DF","Bek Kanan",79,6.1,"Belanda",false),
  mkP(11,"Thom Haye","MF","Gel. Bertahan",86,17.4,"Indonesia",true),
  mkP(12,"Alfeandra Dewangga","MF","Gel. Bertahan",74,3.9,"Indonesia",false),
  mkP(13,"Robi Darwis","MF","Gel. Bertahan",72,2.6,"Indonesia",false),
  mkP(14,"Marc Klok","MF","Gel. Tengah",80,7.0,"Indonesia",true),
  mkP(15,"Adam Alis","MF","Gel. Tengah",76,4.8,"Indonesia",true),
  mkP(16,"Berguinho","MF","Gel. Serang",75,4.3,"Brasil",true),
  mkP(17,"Luciano Guaycochea","MF","Gel. Serang",74,3.9,"Argentina",false),
  mkP(18,"Saddil Ramdani","FW","Sayap Kiri",78,5.7,"Indonesia",false),
  mkP(19,"Eliano Reijnders","FW","Sayap Kanan",83,10.4,"Indonesia",true),
  mkP(20,"Beckham Putra","FW","Sayap Kanan",79,6.1,"Indonesia",false),
  mkP(21,"Andrew Jung","FW","Depan Tengah",81,8.7,"Prancis",true),
  mkP(22,"Sergio Castel","FW","Depan Tengah",80,7.8,"Spanyol",false),
  mkP(23,"Uilliam","FW","Depan Tengah",75,4.3,"Brasil",false),
  mkP(24,"Ramon Tanque","FW","Depan Tengah",74,3.9,"Brasil",false),
];

// ─── OPPONENTS ───────────────────────────────────────────────
const OPPONENTS:Opponent[]=[
  {name:"Persija Jakarta",ovr:75.8,atk:76.2,mid:75.6,def:77.6,stadium:"JIS",isAway:false,formation:"4-3-3",scorers:["Rizky Ridho","Jordi Amat","Jean Mota"],color:"#ea580c",dangerPlayers:["Rizky Ridho (DF)","Jordi Amat (DF)"],recentForm:["D","W","W","W","L"],isDerby:true,strengths:["Bek tengah sangat kuat","Fisik pemain tangguh"],weaknesses:["Lemah sisi kiri tengah","Rentan counter-attack"],tacticalTip:"Gunakan 4-3-3, serang sisi kiri! Awasi Rizky Ridho.",squad:[{name:"Rizky Ridho",pos:"DF",rating:84},{name:"Jordi Amat",pos:"DF",rating:83},{name:"Jean Mota",pos:"MF",rating:81},{name:"Nadeo Argawinata",pos:"GK",rating:80},{name:"Figo Dennis",pos:"FW",rating:78}]},
  {name:"Bali United",ovr:75.4,atk:76.4,mid:77.4,def:74.3,stadium:"Kapten I Wayan Dipta",isAway:true,formation:"4-4-2",scorers:["Teppei Yachida","Diego Campos","Thijmen Goppel"],color:"#dc2626",dangerPlayers:["Diego Campos (FW)","Teppei Yachida (MF)"],recentForm:["D","L","W","D","W"],isDerby:false,strengths:["Lini tengah kreatif","Duet striker mematikan"],weaknesses:["Bek sayap sering terlambat","Lemah di bola udara"],tacticalTip:"Manfaatkan bola udara, lindungi sayap dari Campos.",squad:[{name:"Teppei Yachida",pos:"MF",rating:83},{name:"Diego Campos",pos:"FW",rating:83},{name:"Thijmen Goppel",pos:"FW",rating:83},{name:"Komang Teguh",pos:"DF",rating:73},{name:"I Made Andhika",pos:"GK",rating:72}]},
  {name:"Dewa United",ovr:75.2,atk:76.0,mid:75.8,def:73.8,stadium:"Indomilk Arena",isAway:false,formation:"4-2-3-1",scorers:["Rafael Struick","Taisei Marukawa","Sonny Stevens"],color:"#7c3aed",dangerPlayers:["Rafael Struick (FW)","Taisei Marukawa (FW)"],recentForm:["W","D","W","W","D"],isDerby:false,strengths:["Transisi cepat & agresif","Duet winger berbahaya"],weaknesses:["Pertahanan tidak terorganisir","Lemah lawan tim bertahan"],tacticalTip:"Bermain bertahan, tunggu serangan balik.",squad:[{name:"Rafael Struick",pos:"FW",rating:81},{name:"Taisei Marukawa",pos:"FW",rating:80},{name:"Sonny Stevens",pos:"GK",rating:79},{name:"Welber Jardim",pos:"MF",rating:77},{name:"Rizky Faidan",pos:"DF",rating:75}]},
  {name:"PSM Makassar",ovr:74.6,atk:75.8,mid:73.0,def:76.2,stadium:"Batakan",isAway:true,formation:"3-5-2",scorers:["Dusan Lagator","Yuran Fernandes","Victor Luiz"],color:"#dc2626",dangerPlayers:["Dusan Lagator (DF)","Yuran Fernandes (DF)"],recentForm:["D","W","D","L","W"],isDerby:false,strengths:["Blok pertahanan solid","Disiplin taktis"],weaknesses:["Kurang kreativitas","Wing-back sering terbuka"],tacticalTip:"Pressure wing-back, serang lewat sayap!",squad:[{name:"Dusan Lagator",pos:"DF",rating:80},{name:"Yuran Fernandes",pos:"DF",rating:80},{name:"Victor Luiz",pos:"DF",rating:79},{name:"Luka Cumic",pos:"FW",rating:79},{name:"Kenzo Nambu",pos:"MF",rating:76}]},
  {name:"Borneo FC",ovr:74.6,atk:74.5,mid:78.8,def:71.1,stadium:"Segiri",isAway:false,formation:"5-3-2",scorers:["Mariano Peralta","Juan Felipe Villa","Nadeo Argawinata"],color:"#f97316",dangerPlayers:["Mariano Peralta (FW)","Juan Felipe Villa (MF)"],recentForm:["L","D","W","W","L"],isDerby:false,strengths:["Lini tengah paling dominan","Possession tinggi"],weaknesses:["Pertahanan sangat rentan","Lambat transisi"],tacticalTip:"Pressing tinggi, kuras stamina gelandang!",squad:[{name:"Mariano Peralta",pos:"FW",rating:83},{name:"Juan Felipe Villa",pos:"MF",rating:81},{name:"Kei Hirose",pos:"MF",rating:80},{name:"Nadeo Argawinata",pos:"GK",rating:80},{name:"Lerby Eliandry",pos:"FW",rating:77}]},
  {name:"Malut United",ovr:74.1,atk:76.0,mid:74.0,def:74.6,stadium:"Gelora Kie Raha",isAway:true,formation:"4-3-3",scorers:["Jorge Correa","Diego Martínez","Yakob Sayuri"],color:"#0891b2",dangerPlayers:["Jorge Correa (FW)","Diego Martínez (FW)"],recentForm:["W","W","W","L","D"],isDerby:false,strengths:["Duet penyerang asing tajam","Semangat juang tinggi"],weaknesses:["Tidak berpengalaman laga besar","Mudah panik"],tacticalTip:"Cetak gol cepat, mereka akan panik!",squad:[{name:"Jorge Correa",pos:"FW",rating:77},{name:"Diego Martínez",pos:"FW",rating:77},{name:"Yakob Sayuri",pos:"DF",rating:76},{name:"Jonatan Miran",pos:"MF",rating:74},{name:"Rivaldo Soplanit",pos:"MF",rating:74}]},
  {name:"Bhayangkara",ovr:73.8,atk:75.2,mid:74.7,def:72.8,stadium:"PTIK Jakarta",isAway:false,formation:"4-4-2",scorers:["Matias Mier","Ryo Matsumura","Junior Brandao"],color:"#1e40af",dangerPlayers:["Matias Mier (MF)","Ryo Matsumura (FW)"],recentForm:["L","L","D","L","W"],isDerby:false,strengths:["Gelandang serang kreatif","Fans fanatik"],weaknesses:["Inkonsisten","Lemah bola mati"],tacticalTip:"Manfaatkan set piece, lemah di bola mati!",squad:[{name:"Matias Mier",pos:"MF",rating:80},{name:"Ryo Matsumura",pos:"FW",rating:78},{name:"Junior Brandao",pos:"FW",rating:77},{name:"Rezaldi Hehanusa",pos:"MF",rating:75},{name:"Novan Setya",pos:"GK",rating:72}]},
  {name:"Persebaya",ovr:73.9,atk:76.0,mid:73.5,def:72.9,stadium:"Gelora Bung Tomo",isAway:true,formation:"4-2-3-1",scorers:["Francisco Rivera","Bruno","Ernando Ari"],color:"#16a34a",dangerPlayers:["Francisco Rivera (MF)","Bruno (FW)"],recentForm:["D","L","D","L","D"],isDerby:false,strengths:["Menyerang di tengah","Atmosfer kandang intimidatif"],weaknesses:["Pertahanan bermasalah","Tergantung Rivera"],tacticalTip:"Matikan Rivera, serangan Persebaya mandek.",squad:[{name:"Francisco Rivera",pos:"MF",rating:80},{name:"Bruno",pos:"FW",rating:80},{name:"Ernando Ari",pos:"GK",rating:77},{name:"Hansamu Yama",pos:"DF",rating:76},{name:"M. Fatchurrohman",pos:"DF",rating:74}]},
  {name:"Persis Solo",ovr:73.1,atk:75.4,mid:73.5,def:70.4,stadium:"Manahan",isAway:false,formation:"4-3-3",scorers:["Moussa Sidibé","Sho Yamamoto","Ramadhan Sananta"],color:"#dc2626",dangerPlayers:["Moussa Sidibé (FW)","Sho Yamamoto (MF)"],recentForm:["L","W","W","W","W"],isDerby:false,strengths:["Penyerang asing tajam","Form bagus"],weaknesses:["Pertahanan paling lemah","Tidak ada bek kelas"],tacticalTip:"Serangan langsung! Pertahanan rapuh dari sayap.",squad:[{name:"Moussa Sidibé",pos:"FW",rating:79},{name:"Sho Yamamoto",pos:"MF",rating:76},{name:"Ramadhan Sananta",pos:"FW",rating:76},{name:"Abdul Rachman",pos:"DF",rating:70},{name:"Mahesa Jenar",pos:"GK",rating:72}]},
  {name:"Persik Kediri",ovr:73.0,atk:73.6,mid:74.5,def:72.5,stadium:"Brawijaya",isAway:true,formation:"4-4-2",scorers:["Adrian Luna","Zé Valente","Rohit Chand"],color:"#16a34a",dangerPlayers:["Adrian Luna (FW)","Zé Valente (MF)"],recentForm:["W","W","W","D","W"],isDerby:false,strengths:["Form sangat bagus","Gelandang asing kreatif"],weaknesses:["Tidak punya bintang","Rentan tekanan mental"],tacticalTip:"Jangan remehkan, waspada serangan balik!",squad:[{name:"Adrian Luna",pos:"FW",rating:79},{name:"Zé Valente",pos:"MF",rating:77},{name:"Rohit Chand",pos:"MF",rating:75},{name:"Rishadi Fauzi",pos:"DF",rating:73},{name:"Bagas Kaffa",pos:"GK",rating:71}]},
  {name:"PSBS Biak",ovr:72.8,atk:75.0,mid:74.5,def:71.0,stadium:"Mandala",isAway:false,formation:"3-5-2",scorers:["Jonata Machado","Abel Argañaraz","Julián Velázquez"],color:"#0369a1",dangerPlayers:["Jonata Machado (MF)","Abel Argañaraz (FW)"],recentForm:["W","W","W","L","D"],isDerby:false,strengths:["Gelandang asing berkualitas","Tekad tinggi"],weaknesses:["Tiga bek mudah ditembus","Kurang pengalaman"],tacticalTip:"Serangan sisi lebar, hancurkan tiga bek!",squad:[{name:"Jonata Machado",pos:"MF",rating:77},{name:"Abel Argañaraz",pos:"FW",rating:77},{name:"Julián Velázquez",pos:"DF",rating:75},{name:"Jefri Kurniawan",pos:"DF",rating:71},{name:"Santos FC",pos:"GK",rating:68}]},
  {name:"Semen Padang",ovr:72.8,atk:73.0,mid:75.3,def:72.5,stadium:"Haji Agus Salim",isAway:true,formation:"4-2-3-1",scorers:["Charlie Scott","Tin Martic","Bruno Dybal"],color:"#7c3aed",dangerPlayers:["Charlie Scott (MF)","Tin Martic (DF)"],recentForm:["D","W","L","W","W"],isDerby:false,strengths:["Tengah kompak","Kuat di kandang"],weaknesses:["Minim kreativitas depan","Penyerang tidak tajam"],tacticalTip:"Kesabaran, tekan terus — mereka akan kelelahan.",squad:[{name:"Charlie Scott",pos:"MF",rating:77},{name:"Tin Martic",pos:"DF",rating:75},{name:"Bruno Dybal",pos:"MF",rating:75},{name:"Ricky Fajrin",pos:"DF",rating:72},{name:"Renald Pratama",pos:"GK",rating:69}]},
  {name:"Arema FC",ovr:73.2,atk:72.6,mid:74.0,def:73.0,stadium:"Kanjuruhan",isAway:false,formation:"4-3-3",scorers:["Rio Fahmi","Dalberto","Arkhan Fikri"],color:"#1e3a8a",dangerPlayers:["Rio Fahmi (DF)","Dalberto (FW)"],recentForm:["L","D","D","D","L"],isDerby:false,strengths:["Aremania fanatik","Disiplin bertahan"],weaknesses:["Kurang kreativitas","Hasil buruk"],tacticalTip:"Mereka dalam performa buruk, tekan dari awal!",squad:[{name:"Rio Fahmi",pos:"DF",rating:77},{name:"Dalberto",pos:"FW",rating:77},{name:"Arkhan Fikri",pos:"MF",rating:76},{name:"Gustavo França",pos:"MF",rating:76},{name:"Yohanes Ferinando",pos:"GK",rating:73}]},
  {name:"Persita",ovr:72.3,atk:71.6,mid:72.8,def:73.2,stadium:"Sport Center Tangerang",isAway:true,formation:"4-4-2",scorers:["Marios Ogkmpoe","Javlon Guseynov","Bruno da Cruz"],color:"#0891b2",dangerPlayers:["Marios Ogkmpoe (FW)","Javlon Guseynov (DF)"],recentForm:["L","W","W","W","W"],isDerby:false,strengths:["Pertahanan terorganisir","Form lagi bagus"],weaknesses:["Penyerang tidak tajam","Terlalu defensif"],tacticalTip:"Curigai form bagus mereka — matikan Ogkmpoe!",squad:[{name:"Marios Ogkmpoe",pos:"FW",rating:75},{name:"Javlon Guseynov",pos:"DF",rating:74},{name:"Bruno da Cruz",pos:"MF",rating:74},{name:"Renshi Yamaguchi",pos:"MF",rating:73},{name:"Angga Saputro",pos:"GK",rating:72}]},
  {name:"Madura United",ovr:71.1,atk:69.6,mid:74.0,def:70.8,stadium:"Gelora Bangkalan",isAway:false,formation:"5-3-2",scorers:["Jordy Wehrmann","Pedro Monteiro","Maxuel"],color:"#dc2626",dangerPlayers:["Jordy Wehrmann (MF)","Pedro Monteiro (DF)"],recentForm:["W","L","L","W","D"],isDerby:false,strengths:["Parkir bus disiplin","Jordy sulit ditembus"],weaknesses:["Serangan sangat lemah","Tidak ada striker kelas"],tacticalTip:"Bersabar, cari celah — pertahanan sangat kuat!",squad:[{name:"Jordy Wehrmann",pos:"MF",rating:79},{name:"Pedro Monteiro",pos:"DF",rating:75},{name:"Maxuel",pos:"FW",rating:75},{name:"Bagas Rafi",pos:"DF",rating:70},{name:"Satria Tama",pos:"GK",rating:71}]},
  {name:"PSIM Jogja",ovr:68.9,atk:70.2,mid:68.5,def:68.2,stadium:"Mandala Krida",isAway:true,formation:"4-3-3",scorers:["Aleksandar Rakic","Yudha Alkanza","Sugeng Efendi"],color:"#f97316",dangerPlayers:["Aleksandar Rakic (FW)","Yudha Alkanza (MF)"],recentForm:["W","L","D","W","W"],isDerby:false,strengths:["Ambisius tim promosi","Semangat kandang"],weaknesses:["Kualitas pemain terendah","Tidak ada bintang"],tacticalTip:"Mainkan tim terbaik, kemenangan besar bisa diraih.",squad:[{name:"Aleksandar Rakic",pos:"FW",rating:72},{name:"Yudha Alkanza",pos:"MF",rating:70},{name:"Sugeng Efendi",pos:"FW",rating:70},{name:"Fauzan Fajri",pos:"DF",rating:67},{name:"Angga Febri",pos:"GK",rating:68}]},
  {name:"Persijap Jepara",ovr:68.3,atk:68.0,mid:68.8,def:68.2,stadium:"Gelora Bumi Kartini",isAway:false,formation:"4-4-2",scorers:["Kervens Belfort","Mojtaba Lotfi","Fikron Afriyanto"],color:"#059669",dangerPlayers:["Kervens Belfort (MF)","Mojtaba Lotfi (DF)"],recentForm:["D","W","D","L","W"],isDerby:false,strengths:["Motivasi tim baru","Kompak & solid"],weaknesses:["Rating pemain terendah","Kurang pengalaman"],tacticalTip:"Dominasi sejak awal, jangan beri mereka rasa percaya diri.",squad:[{name:"Kervens Belfort",pos:"MF",rating:72},{name:"Mojtaba Lotfi",pos:"DF",rating:70},{name:"Fikron Afriyanto",pos:"DF",rating:69},{name:"Wahyu Prasetyo",pos:"FW",rating:67},{name:"Samudera Alif",pos:"GK",rating:68}]},
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

// ─── FULL INTERACTIVE LINEUP BUILDER ─────────────────────────
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
  const starters=squad.filter(p=>p.starter&&!p.injured&&!p.redCard);
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
  const fitColor=(p:Player)=>{const f=fitness(p);return f>80?'#22c55e':f>60?'#f59e0b':'#ef4444';};

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
                {/* Fitness dot */}
                {pl&&<div style={{position:'absolute',bottom:-3,left:'50%',transform:'translateX(-50%)',
                  width:5,height:5,borderRadius:'50%',background:fitColor(pl),
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
                    <div style={{height:'100%',borderRadius:2,width:`${fit}%`,background:fit>80?'#22c55e':fit>60?'#f59e0b':'#ef4444'}}/>
                  </div>
                  {p.injured&&<div style={{fontSize:7,color:'#ef4444',fontWeight:700}}>🚑</div>}
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
  const[phase,setPhase]=useState<'intro'|'welcome'|'game'>('intro');
  const[managerName,setManagerName]=useState('');
  const[managerRegion,setManagerRegion]=useState('');
  const[tmpName,setTmpName]=useState('');
  const[tmpRegion,setTmpRegion]=useState('');

  type Screen='home'|'tactics'|'market'|'match'|'stats'|'preview'|'end';
  const[screen,setScreen]=useState<Screen>('home');
  const[squad,setSquad]=useState<Player[]>(INITIAL_SQUAD);
  const[market,setMarket]=useState<Player[]>([
    {...mkP(101,"Rizky Ridho","DF","Bek Tengah",84,10.5,"Indonesia",false),club:"Persija"},
    {...mkP(102,"Jordi Amat","DF","Bek Tengah",83,9.8,"Spanyol",false),club:"Persija"},
    {...mkP(103,"Jean Mota","MF","Gel. Tengah",81,7.5,"Brasil",false),club:"Persija"},
    {...mkP(104,"Diego Campos","FW","Sayap Kiri",83,9.0,"Kosta Rika",false),club:"Bali United"},
    {...mkP(105,"Teppei Yachida","MF","Gel. Serang",83,9.2,"Jepang",false),club:"Bali United"},
    {...mkP(106,"Rafael Struick","FW","Sayap Kanan",81,8.5,"Indonesia",false),club:"Dewa United"},
    {...mkP(107,"Mariano Peralta","FW","Sayap Kanan",83,9.5,"Argentina",false),club:"Borneo FC"},
    {...mkP(108,"Matias Mier","MF","Gel. Serang",80,6.8,"Kolombia",false),club:"Bhayangkara"},
    {...mkP(109,"Francisco Rivera","MF","Gel. Serang",80,6.5,"Meksiko",false),club:"Persebaya"},
    {...mkP(110,"Moussa Sidibé","FW","Sayap Kanan",79,6.2,"Guinea",false),club:"Persis Solo"},
    {...mkP(111,"Nadeo Argawinata","GK","Kiper",80,7.0,"Indonesia",false),club:"Borneo FC"},
    {...mkP(112,"Thijmen Goppel","FW","Sayap Kanan",83,9.1,"Indonesia",false),club:"Bali United"},
    {...mkP(113,"Juan Felipe Villa","MF","Gel. Serang",81,7.2,"Kolombia",false),club:"Borneo FC"},
    {...mkP(114,"Adrian Luna","FW","Sayap Kiri",79,6.0,"Uruguay",false),club:"Persik Kediri"},
  ]);

  const[budget,setBudget]=useState(30);
  const[week,setWeek]=useState(0);
  const[points,setPoints]=useState(0);
  const[morale,setMorale]=useState(75);
  const[formation,setFormation]=useState<Formation>('4-4-2');
  const[tactic,setTactic]=useState<'Menyerang'|'Seimbang'|'Bertahan'>('Seimbang');
  const[intensity,setIntensity]=useState<'Lembut'|'Sedang'|'Kasar'>('Sedang');
  const[soundOn,setSoundOn]=useState(true);
  const[showConfetti,setShowConfetti]=useState(false);
  const[matchHistory,setMatchHistory]=useState<{opp:string;res:string;score:string}[]>([]);
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
  const teamOvr=Math.round(starters.reduce((a,p)=>a+p.rating*(p.form/100)*(p.stamina/100),0)/Math.max(1,starters.length));
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
    if(p.injured||p.redCard)return;
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
      sq.filter(p=>p.pos===pos&&!p.injured&&!p.redCard).sort((a,b)=>score(b)-score(a)).slice(0,cnt).forEach(p=>{const i=sq.findIndex(x=>x.id===p.id);if(i>=0)sq[i].starter=true;});
    });
    setSquad(sq);
    notify('✅ Lineup dioptimalkan form & stamina!','good');
  };

  const autoFill=()=>{
    if(soundOn)playClick();
    const sq=squad.map(p=>({...p,starter:false}));
    (Object.entries(FORMATIONS[formation].pos)as[string,number][]).forEach(([pos,cnt])=>{
      sq.filter(p=>p.pos===pos&&!p.injured&&!p.redCard).sort((a,b)=>b.rating-a.rating).slice(0,cnt).forEach(p=>{const i=sq.findIndex(x=>x.id===p.id);if(i>=0)sq[i].starter=true;});
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

  const simOtherMatches=useCallback(()=>{
    setStandings(prev=>{
      const upd=[...prev];
      for(let i=0;i<3;i++){
        const ot=upd.filter(t=>t.name!=='Persib Bandung');
        if(ot.length<2)continue;
        let a=Math.floor(Math.random()*ot.length),b=a;
        while(b===a)b=Math.floor(Math.random()*ot.length);
        const s1=Math.floor(Math.random()*3+(Math.random()>0.7?1:0));
        const s2=Math.floor(Math.random()*3+(Math.random()>0.7?1:0));
        const i1=upd.findIndex(t=>t.name===ot[a].name),i2=upd.findIndex(t=>t.name===ot[b].name);
        upd[i1]={...upd[i1],played:upd[i1].played+1,won:upd[i1].won+(s1>s2?1:0),draw:upd[i1].draw+(s1===s2?1:0),lost:upd[i1].lost+(s1<s2?1:0),gf:upd[i1].gf+s1,ga:upd[i1].ga+s2,points:upd[i1].points+(s1>s2?3:s1===s2?1:0)};
        upd[i2]={...upd[i2],played:upd[i2].played+1,won:upd[i2].won+(s2>s1?1:0),draw:upd[i2].draw+(s1===s2?1:0),lost:upd[i2].lost+(s2<s1?1:0),gf:upd[i2].gf+s2,ga:upd[i2].ga+s1,points:upd[i2].points+(s2>s1?3:s1===s2?1:0)};
      }
      return upd;
    });
  },[]);

  // ─── MATCH ENGINE ────────────────────────────────────────────
  const runInterval=useCallback((curOpp:Opponent,curFm:Formation,curTac:string,curInt:string,curMorale:number,curWeather:typeof WEATHER[0],curStarters:Player[])=>{
    if(intervalRef.current)clearInterval(intervalRef.current);
    intervalRef.current=setInterval(()=>{
      stateRef.current.min+=1;
      const min=stateRef.current.min;
      setMatchMin(min);

      // Count active players (not expelled)
      const activeStarters=curStarters.filter(p=>!stateRef.current.expelled.has(p.id));
      const activeCount=activeStarters.length;

      if(min===45&&!stateRef.current.halfDone){
        stateRef.current.halfDone=true;
        setMatchLogs(prev=>[...prev,{text:`— TURUN MINUM — PERSIB ${stateRef.current.pScore} - ${stateRef.current.oScore} ${curOpp.name}`,type:'halftime',minute:45}]);
        return;
      }
      if(min>=90){if(intervalRef.current)clearInterval(intervalRef.current);finishMatch(stateRef.current.pScore,stateRef.current.oScore,curOpp);return;}

      // ── Decision moment trigger ──
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

      // ── Strength calculation ──
      const avgRating=activeStarters.reduce((a,p)=>a+p.rating*(p.form/100)*(p.stamina/100),0)/Math.max(1,activeStarters.length);
      // Man disadvantage penalty
      const manPenalty=(11-activeCount)*3;
      const tacBonusAtk=curTac==='Menyerang'?3:curTac==='Bertahan'?-2:0;
      const tacBonusDef=curTac==='Bertahan'?3:curTac==='Menyerang'?-2:0;
      // Intensity: affects foul rate & scoring chance
      const intAtkBonus=curInt==='Kasar'?2:curInt==='Lembut'?-1:0;
      const intFoulMult=curInt==='Kasar'?2.5:curInt==='Lembut'?0.4:1;
      const homeAdv=curOpp.isAway?-2:3;
      const moraleF=(curMorale-50)/25;
      const derbyF=curOpp.isDerby?2:0;
      const weatherF=(curWeather.eff.sta+curWeather.eff.pas)/2;
      const fmBonus=FORMATIONS[curFm].bonus;
      let fmMatchup=0;
      if((FORMATIONS[curFm].strong as readonly string[]).includes(curOpp.formation))fmMatchup=3;
      if((FORMATIONS[curFm].weak as readonly string[]).includes(curOpp.formation))fmMatchup=-3;

      const myAtkStr=avgRating+tacBonusAtk+homeAdv+moraleF+derbyF+fmBonus.atk+fmMatchup+weatherF+intAtkBonus-manPenalty;
      const myDefStr=avgRating+tacBonusDef+fmBonus.def+homeAdv*0.5-manPenalty;
      const oppAtkStr=curOpp.atk+(curOpp.isAway?2:-1)+(curOpp.isDerby?3:0);
      const oppDefStr=curOpp.def+(curOpp.isAway?1:2);

      const pGoal=Math.min(0.038,Math.max(0.005,0.018+(myAtkStr-oppDefStr)*0.001));
      const oGoal=Math.min(0.035,Math.max(0.005,0.016+(oppAtkStr-myDefStr)*0.001));
      // Foul prob scaled by intensity
      const foulProb=0.008*intFoulMult;
      // Injury prob (higher with Kasar intensity)
      const injuryProb=curInt==='Kasar'?0.003:curInt==='Sedang'?0.001:0.0003;

      const r1=Math.random(),r2=Math.random(),r3=Math.random(),r4=Math.random();

      if(r1<pGoal){
        // PERSIB GOAL
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
        // OPPONENT GOAL
        const scorer=curOpp.scorers[Math.floor(Math.random()*curOpp.scorers.length)];
        stateRef.current.oScore++;
        setScore({p:stateRef.current.pScore,o:stateRef.current.oScore});
        setMatchLogs(prev=>[...prev,{text:`😔 ${min}' GOL ${curOpp.name.toUpperCase()}! ${scorer} — ${GOAL_O[Math.floor(Math.random()*GOAL_O.length)]}`,type:'goal-o',minute:min}]);
        setGoalToast({scorer,assist:null,minute:min,isP:false});
        setLiveStats(prev=>({...prev,shotsO:(prev.shotsO||0)+1}));
        if(soundOn)playCrowd();
      } else if(r3<foulProb&&activeStarters.length>0){
        // FOUL / YELLOW CARD
        const pl=activeStarters[Math.floor(Math.random()*activeStarters.length)];
        // Check double yellow
        const curYellows=(pl.matchYellows||0)+1;
        if(curYellows>=2){
          // RED CARD (second yellow)
          setMatchSquad(sq=>sq.map(p=>p.id===pl.id?{...p,matchYellows:2,redCard:true,starter:false}:p));
          stateRef.current.expelled.add(pl.id);
          setExpelledIds(s=>new Set([...s,pl.id]));
          setMatchLogs(prev=>[...prev,{text:`🟨🟥 ${min}' KARTU MERAH! ${pl.name} — dua kartu kuning, Persib main ${activeCount-1} orang!`,type:'red',minute:min}]);
          setSquad(sq=>sq.map(p=>p.id===pl.id?{...p,yellowCards:p.yellowCards+1,redCard:true}:p));
        } else {
          // Yellow card
          setMatchSquad(sq=>sq.map(p=>p.id===pl.id?{...p,matchYellows:curYellows}:p));
          setMatchLogs(prev=>[...prev,{text:`🟨 ${min}' KARTU KUNING — ${pl.name} (${curYellows}/2)`,type:'card',minute:min}]);
          setSquad(sq=>sq.map(p=>p.id===pl.id?{...p,yellowCards:p.yellowCards+1,matchYellows:curYellows}:p));
          setLiveStats(prev=>({...prev,yellowsP:prev.yellowsP+1}));
        }
      } else if(curInt==='Kasar'&&r3<foulProb*1.5&&activeStarters.length>0&&r3>foulProb){
        // STRAIGHT RED for very rough play
        const pl=activeStarters[Math.floor(Math.random()*activeStarters.length)];
        stateRef.current.expelled.add(pl.id);
        setExpelledIds(s=>new Set([...s,pl.id]));
        setMatchSquad(sq=>sq.map(p=>p.id===pl.id?{...p,redCard:true,starter:false}:p));
        setSquad(sq=>sq.map(p=>p.id===pl.id?{...p,redCard:true}:p));
        setMatchLogs(prev=>[...prev,{text:`🟥 ${min}' KARTU MERAH LANGSUNG! ${pl.name} — tackle brutal! Persib main ${activeCount-1} orang!`,type:'red',minute:min}]);
      } else if(r4<injuryProb&&activeStarters.length>0){
        // MATCH INJURY
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

      const possDiff=(myAtkStr-oppAtkStr)/30;
      setLiveStats(prev=>({...prev,possession:Math.round(50+possDiff*10+Math.random()*6-3)}));
    },Math.round(1000/speed));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[speed,soundOn,playGoal,playCrowd,decisionUsed]);

  useEffect(()=>{
    if(isRunning&&!isPaused)runInterval(opp,matchFormation,matchTactic,matchIntensity,morale,weather,matchSquad.length?matchSquad.filter(p=>p.starter&&!p.redCard&&!p.injured):starters);
    else if(isPaused&&intervalRef.current)clearInterval(intervalRef.current);
    return()=>{if(intervalRef.current)clearInterval(intervalRef.current);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[speed,isPaused,isRunning]);

  // Handle decision choice
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
    setExpelledIds(new Set());setActiveDecision(null);setDecisionUsed(new Set());
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
    setTimeout(()=>{
      const income=pts===3?(curOpp.isDerby?8:4):pts===1?2:1;
      setBudget(b=>+(b+income).toFixed(1));
      setPoints(p=>p+pts);
      setMorale(m=>Math.min(100,Math.max(0,m+(pts===3?10:pts===1?-2:-12))));
      // Update player stats + recover injuries
      setSquad(sq=>sq.map(p=>({
        ...p,
        form:Math.min(100,Math.max(50,p.form+(pts===3?5:pts===1?0:-8)+(Math.random()*8-4))),
        stamina:Math.min(100,Math.max(30,p.stamina-12+(Math.random()*8))),
        unhappy:p.starter?0:Math.min(5,p.unhappy+1),
        matchesPlayed:p.starter?p.matchesPlayed+1:p.matchesPlayed,
        redCard:false,// reset red card after match (suspension handled below)
        matchYellows:0,
        injuryWeeks:p.injuryWeeks>0?p.injuryWeeks-1:0,
        injured:p.injuryWeeks>1,// still injured if weeks remain
      })));
      simOtherMatches();
      const events=[
        {title:"Sponsor Tambahan!",desc:"Sponsorship baru masuk +4M.",type:'good'as const,effect:()=>setBudget(b=>+(b+4).toFixed(1))},
        {title:"Bonus Direksi",desc:"Direktur senang, bonus +3M!",type:'good'as const,effect:()=>setBudget(b=>+(b+3).toFixed(1))},
        {title:"Renovasi Fasilitas",desc:"Perbaikan fasilitas -2M.",type:'bad'as const,effect:()=>setBudget(b=>+(Math.max(0,b-2)).toFixed(1))},
        {title:"Media Positif!",desc:"Liputan bagus, morale +8.",type:'good'as const,effect:()=>setMorale(m=>Math.min(100,m+8))},
        {title:"Gejolak Internal",desc:"Rumor internal, morale -5.",type:'bad'as const,effect:()=>setMorale(m=>Math.max(0,m-5))},
        {title:"Recovery Pemain",desc:"Tim pulih sempurna dari latihan!",type:'neutral'as const,effect:()=>setSquad(sq=>sq.map(p=>({...p,stamina:Math.min(100,p.stamina+15)})))},
      ];
      const ev=events[Math.floor(Math.random()*events.length)];
      ev.effect();
      setWeeklyEvent({title:ev.title,desc:ev.desc,type:ev.type});
      if(week+1>=OPPONENTS.length||morale<=5){setTimeout(()=>setScreen('end'),1500);}
      else{setWeek(w=>w+1);setTimeout(()=>setScreen('home'),1500);}
    },2500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[soundOn,playWhistle,playWin,simOtherMatches,week,morale]);

  const makeSub=(out:Player,incoming:Player)=>{
    if(subsLeft<=0)return;
    if(soundOn)playClick();
    setMatchSquad(sq=>sq.map(p=>p.id===out.id?{...incoming,starter:true}:p.id===incoming.id?{...out,starter:false}:p));
    setSubsLeft(s=>s-1);setSubSelectOut(null);setShowSubPanel(false);
    setMatchLogs(prev=>[...prev,{text:`🔄 ${stateRef.current.min}' SUB: ${incoming.name} ↔ ${out.name}`,type:'sub',minute:stateRef.current.min}]);
  };

  const resetGame=()=>{localStorage.removeItem('pm26v4');window.location.reload();};

  // ── INTRO ────────────────────────────────────────────────────
  if(phase==='intro')return(
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <TigerBg/>
      <motion.div initial={{opacity:0,y:40}}animate={{opacity:1,y:0}}transition={{duration:0.7,ease:[0.22,1,0.36,1]}}className="relative z-10 w-full max-w-sm mx-4">
        <motion.div initial={{opacity:0}}animate={{opacity:1}}transition={{delay:0.4}}className="text-center mb-6">
          <div className="inline-block bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-xs text-amber-400/80 tracking-widest mb-2">SPECIAL THANKS TO</div>
          <div className="text-base font-bold text-amber-300">AR RAZI NUR INSAN</div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-1"><MapPin size={10}/>Bobotoh Cimahi</div>
        </motion.div>
        <Glass className="p-7 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500"/>
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600"/>
          <motion.div initial={{scale:0,rotate:-180}}animate={{scale:1,rotate:0}}transition={{delay:0.3,type:'spring',stiffness:200,damping:20}}className="flex justify-center mb-5">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 border-4 border-amber-400 flex items-center justify-center shadow-2xl shadow-blue-500/40">
              <Shield className="text-white" size={44}/><div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center text-blue-900 font-black text-xs">26</div>
            </div>
          </motion.div>
          <h1 className="text-2xl font-black text-center tracking-tight text-white mb-1">PERSIB <span className="text-amber-400">MANAGER</span></h1>
          <p className="text-center text-slate-400 text-xs mb-6">BRI Super League 2025/26 · 18 Tim · 295 Pemain</p>
          <div className="space-y-4">
            <div><label className="text-[10px] text-slate-400 font-semibold tracking-widest block mb-1.5">NAMA MANAGER</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15}/><input type="text" value={tmpName} onChange={e=>setTmpName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(tmpName.trim()&&tmpRegion.trim()&&(setManagerName(tmpName.trim()),setManagerRegion(tmpRegion.trim()),setPhase('welcome')))} placeholder="Nama kamu..." className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 pl-9 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"/></div>
            </div>
            <div><label className="text-[10px] text-slate-400 font-semibold tracking-widest block mb-1.5">BOBOTOH DARI MANA?</label>
              <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15}/><input type="text" value={tmpRegion} onChange={e=>setTmpRegion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(tmpName.trim()&&tmpRegion.trim()&&(setManagerName(tmpName.trim()),setManagerRegion(tmpRegion.trim()),setPhase('welcome')))} placeholder="Kota / daerah..." className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 pl-9 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"/></div>
            </div>
            <motion.button whileHover={{scale:1.02}}whileTap={{scale:0.98}}onClick={()=>{if(tmpName.trim()&&tmpRegion.trim()){setManagerName(tmpName.trim());setManagerRegion(tmpRegion.trim());setPhase('welcome');}}}disabled={!tmpName.trim()||!tmpRegion.trim()}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all ${tmpName.trim()&&tmpRegion.trim()?'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30':'bg-slate-700/40 text-slate-500 cursor-not-allowed'}`}>
              <Swords size={18}/>MULAI KARIR
            </motion.button>
          </div>
        </Glass>
        <div className="text-center mt-5 text-xs text-slate-500">Maung Bandung · Juara BRI Liga 1 2024/25 🏆</div>
      </motion.div>
    </div>
  );

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
                {matchHistory.length>0&&<Glass className="px-4 py-2.5"><div className="text-[10px] text-slate-400 font-semibold mb-2">HASIL TERAKHIR</div><div className="flex gap-1.5">{matchHistory.slice(-7).map((m,i)=><div key={i}title={`${m.opp} ${m.score}`}className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${m.res==='M'?'bg-green-500/25 text-green-400 border border-green-500/30':m.res==='S'?'bg-amber-500/25 text-amber-400 border border-amber-500/30':'bg-red-500/25 text-red-400 border border-red-500/30'}`}>{m.res}</div>)}</div></Glass>}
                {/* Injury alerts */}
                {squad.filter(p=>p.injured).length>0&&(
                  <Glass className="px-4 py-2.5 border border-red-500/20">
                    <div className="text-[10px] text-red-400 font-bold mb-1 flex items-center gap-1"><AlertTriangle size={10}/>PEMAIN CEDERA</div>
                    {squad.filter(p=>p.injured).map(p=><div key={p.id}className="text-[10px] text-slate-300">🚑 {p.name} — {p.injuryWeeks} pekan lagi</div>)}
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
                              {p.yellowCards>=4&&<span className="text-[9px] text-yellow-400">🟨{p.yellowCards}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5"><Star size={10}/>{p.rating}</span>
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
            {screen==='stats'&&(
              <motion.div key="stats"initial={{opacity:0,x:30}}animate={{opacity:1,x:0}}exit={{opacity:0,x:-30}}transition={{duration:0.3}}className="space-y-3">
                <button onClick={()=>nav('home')}className="text-sm text-blue-400 hover:text-blue-300">← Kembali</button>
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
                <Glass className="p-4">
                  <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-3 flex items-center gap-1.5"><Award size={12}className="text-amber-400"/>TOP SCORER</div>
                  {topScorers.length===0?<p className="text-xs text-slate-500 text-center py-2">Belum ada gol</p>:<div className="space-y-1.5">{topScorers.slice(0,7).map((p,i)=><div key={p.id}className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-slate-800/30"><span className={`text-sm font-black w-5 text-center ${i===0?'text-amber-400':i===1?'text-slate-300':i===2?'text-amber-700':'text-slate-500'}`}>{i+1}</span><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${posBg(p.pos)} ${posColor(p.pos)}`}>{p.pos}</div><div className="flex-1"><div className="text-xs font-semibold text-white">{p.name}</div><div className="text-[9px] text-slate-400">{p.posInd} · {p.matchesPlayed} laga</div></div><div className="text-right"><div className="text-lg font-black text-amber-400 leading-none">{p.goals}</div><div className="text-[9px] text-slate-500">gol</div></div></div>)}</div>}
                </Glass>
                <Glass className="p-4">
                  <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-3 flex items-center gap-1.5"><Zap size={12}className="text-blue-400"/>TOP ASSIST</div>
                  {topAssists.length===0?<p className="text-xs text-slate-500 text-center py-2">Belum ada assist</p>:<div className="space-y-1.5">{topAssists.slice(0,7).map((p,i)=><div key={p.id}className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-slate-800/30"><span className={`text-sm font-black w-5 text-center ${i===0?'text-blue-400':i===1?'text-slate-300':i===2?'text-blue-700':'text-slate-500'}`}>{i+1}</span><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${posBg(p.pos)} ${posColor(p.pos)}`}>{p.pos}</div><div className="flex-1"><div className="text-xs font-semibold text-white">{p.name}</div><div className="text-[9px] text-slate-400">{p.posInd}</div></div><div className="text-right"><div className="text-lg font-black text-blue-400 leading-none">{p.assists}</div><div className="text-[9px] text-slate-500">assist</div></div></div>)}</div>}
                </Glass>
              </motion.div>
            )}

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
                </div>
                <AnimatePresence>
                  {showTacticPanel&&(
                    <motion.div initial={{height:0,opacity:0}}animate={{height:'auto',opacity:1}}exit={{height:0,opacity:0}}>
                      <Glass className="p-4 overflow-hidden">
                        <div className="text-[10px] text-blue-400 font-bold tracking-widest mb-3">UBAH TAKTIK</div>
                        <div className="mb-3"><div className="text-[10px] text-slate-400 mb-1.5">Formasi</div><div className="flex gap-1.5 flex-wrap">{(Object.keys(FORMATIONS)as Formation[]).map(f=><button key={f}onClick={()=>setMatchFormation(f)}className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${matchFormation===f?'bg-blue-600 text-white':'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'}`}>{f}</button>)}</div></div>
                        <div className="mb-3"><div className="text-[10px] text-slate-400 mb-1.5">Taktik</div><div className="flex gap-2">{(['Menyerang','Seimbang','Bertahan']as const).map(t=><button key={t}onClick={()=>setMatchTactic(t)}className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${matchTactic===t?'bg-blue-600 text-white':'bg-slate-800/60 text-slate-400'}`}>{t}</button>)}</div></div>
                        <div><div className="text-[10px] text-slate-400 mb-1.5">Intensitas</div><div className="flex gap-2">{(['Lembut','Sedang','Kasar']as const).map(t=><button key={t}onClick={()=>setMatchIntensity(t)}className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${matchIntensity===t?'bg-orange-600 text-white':'bg-slate-800/60 text-slate-400'}`}>{t}</button>)}</div></div>
                        <button onClick={()=>{setShowTacticPanel(false);setIsPaused(false);}}className="w-full mt-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-semibold hover:bg-blue-500/30 transition">Terapkan & Lanjutkan ▶</button>
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
                          <><div className="text-[10px] text-slate-400 mb-1">Keluar: <span className="text-red-400 font-semibold">{subSelectOut.name}</span></div>
                          <div className="text-[10px] text-slate-400 mb-2">Pilih MASUK ({subSelectOut.pos}):</div>
                          <div className="space-y-1 max-h-36 overflow-y-auto">
                            {(matchSquad.length?matchSquad:squad).filter(p=>!p.starter&&p.pos===subSelectOut.pos&&!p.injured).map(p=>(
                              <button key={p.id}onClick={()=>makeSub(subSelectOut,p)}className="w-full p-2 rounded-lg bg-slate-800/50 hover:bg-green-500/15 text-left text-xs flex justify-between items-center transition">
                                <span className="text-white">{p.name}</span><span className="text-amber-400 text-[10px] font-bold">{p.rating}</span>
                              </button>
                            ))}
                            {!(matchSquad.length?matchSquad:squad).filter(p=>!p.starter&&p.pos===subSelectOut.pos&&!p.injured).length&&<p className="text-xs text-slate-500 text-center py-2">Tidak ada {subSelectOut.pos} di bangku</p>}
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

            {/* END SEASON — Epic screen */}
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
