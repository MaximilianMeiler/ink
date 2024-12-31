let allCards = {
  "adder": {
    card: "adder",
    name: "Adder",
    costType:"blood",
    cost: 2,
    sigils: ["deathtouch"],
    defaultSigils: 1,
    damage: 1,
    health: 1,
    tribe: "reptile",
    rare: false
  },
  "alpha": {
    card: "alpha",
    name: "Alpha",
    costType:"bone",
    cost: 4,
    sigils: ["buffneighbours"],
    defaultSigils: 1,
    damage: 1,
    health: 2,
    tribe: "canine",
    rare: false
  },
  "amalgam": {
    card: "amalgam",
    name: "Amalgam",
    costType:"blood",
    cost: 2,
    sigils: [],
    defaultSigils: 0,
    damage: 3,
    health: 3,
    tribe: "all",
    rare: false
  },
  "amoeba": {
    card: "amoeba",
    name: "Ameoba",
    costType:"bone",
    cost: 2,
    sigils: ["randomability"],
    defaultSigils: 1,
    damage: 1,
    health: 2,
    tribe: "none",
    rare: false
  },
  "ant": {
    card: "ant",
    name: "Worker Ant",
    costType:"blood",
    cost: 1,
    sigils: ["antdamage"],
    defaultSigils: 1,
    damage: 0,
    health: 2,
    tribe: "insect",
    rare: false
  },
  "antqueen": {
    card: "antqueen",
    name: "Ant Queen",
    costType:"blood",
    cost: 2,
    sigils: ["drawant", "antdamage"],
    defaultSigils: 2,
    damage: 0,
    health: 3,
    tribe: "insect",
    rare: false
  },
  "bat": {
    card: "bat",
    name: "Bat",
    costType:"bone",
    cost: 4,
    sigils: ["flying"],
    defaultSigils: 1,
    damage: 2,
    health: 1,
    tribe: "none",
    rare: false
  },
  "beaver": {
    card: "beaver",
    name: "Beaver",
    costType:"blood",
    cost: 2,
    sigils: ["createdams"],
    defaultSigils: 1,
    damage: 1,
    health: 4,
    tribe: "none",
    rare: false
  },
  "beehive": {
    card: "beehive",
    name: "Beehive",
    costType:"blood",
    cost: 1,
    sigils: ["beesonhit"],
    defaultSigils: 1,
    damage: 0,
    health: 2,
    tribe: "insect",
    rare: false
  },
  "bloodhound": {
    card: "bloodhound",
    name: "Bloodhound",
    costType:"blood",
    cost: 2,
    sigils: ["guarddog"],
    defaultSigils: 1,
    damage: 2,
    health: 3,
    tribe: "canine",
    rare: false
  },
  "bullfrog": {
    card: "bullfrog",
    name: "Bullfrog",
    costType:"blood",
    cost: 1,
    sigils: ["reach"],
    defaultSigils: 1,
    damage: 1,
    health: 2,
    tribe: "reptile",
    rare: false
  },
  "cat": {
    card: "cat",
    name: "Cat",
    costType:"blood",
    cost: 1,
    sigils: ["sacrificial"],
    defaultSigils: 1,
    damage: 0,
    health: 1,
    tribe: "none",
    rare: false
  },
  "cockroach": {
    card: "cockroach",
    name: "Cockroach",
    costType:"bone",
    cost: 4,
    sigils: ["drawcopyondeath"],
    defaultSigils: 1,
    damage: 1,
    health: 1,
    tribe: "insect",
    rare: false
  },
  "coyote": {
    card: "coyote",
    name: "Coyote",
    costType:"bone",
    cost: 4,
    sigils: [],
    defaultSigils: 0,
    damage: 2,
    health: 1,
    tribe: "canine",
    rare: false
  },
  "daus": {
    card: "daus",
    name: "The Daus",
    costType:"blood",
    cost: 2,
    sigils: ["createbells"],
    defaultSigils: 1,
    damage: 2,
    health: 2,
    tribe: "hooved",
    rare: false
  },
  "deer": {
    card: "deer",
    name: "Elk",
    costType:"blood",
    cost: 2,
    sigils: ["strafe"],
    defaultSigils: 1,
    damage: 2,
    health: 4,
    tribe: "hooved",
    rare: false
  },
  "deercub": {
    card: "deercub",
    name: "Elk Fawn",
    costType:"blood",
    cost: 1,
    sigils: ["strafe", "evolve"],
    defaultSigils: 2,
    damage: 1,
    health: 1,
    tribe: "hooved",
    rare: false
  },
  "fieldmice": {
    card: "fieldmice",
    name: "Field Mice",
    costType:"blood",
    cost: 2,
    sigils: ["drawcopy"],
    defaultSigils: 1,
    damage: 2,
    health: 2,
    tribe: "none",
    rare: false
  },
  "geck": {
    card: "geck",
    name: "Geck",
    costType:"bone",
    cost: 0,
    sigils: [],
    defaultSigils: 0,
    damage: 1,
    health: 1,
    tribe: "reptile",
    rare: false
  },
  "goat": {
    card: "goat",
    name: "Black Goat",
    costType:"blood",
    cost: 1,
    sigils: ["tripleblood"],
    defaultSigils: 1,
    damage: 0,
    health: 1,
    tribe: "hooved",
    rare: false
  },
  "grizzly": {
    card: "grizzly",
    name: "Grizzly",
    costType:"blood",
    cost: 3,
    sigils: [],
    defaultSigils: 0,
    damage: 4,
    health: 6,
    tribe: "none",
    rare: false
  },
  "jerseydevil_sleeping": {
    card: "jerseydevil_sleeping",
    name: "Child 13",
    costType:"blood",
    cost: 1,
    sigils: ["sacrificial", "sacrificialswap"],
    defaultSigils: 2,
    damage: 0,
    health: 1,
    tribe: "hooved",
    rare: false
  },
  "kingfisher": {
    card: "kingfisher",
    name: "Kingfisher",
    costType:"blood",
    cost: 1,
    sigils: ["flying", "submerge"],
    defaultSigils: 2,
    damage: 1,
    health: 1,
    tribe: "avian",
    rare: false
  },
  "maggots": {
    card: "maggots",
    name: "Corpse Maggots",
    costType:"bone",
    cost: 5,
    sigils: ["corpseeater"],
    defaultSigils: 1,
    damage: 1,
    health: 2,
    tribe: "insect",
    rare: false
  },
  "magpie": {
    card: "magpie",
    name: "Magpie",
    costType:"blood",
    cost: 2,
    sigils: ["flying", "tutor"],
    defaultSigils: 2,
    damage: 1,
    health: 1,
    tribe: "avian",
    rare: false
  },
  "mantis": {
    card: "mantis",
    name: "Mantis",
    costType:"blood",
    cost: 1,
    sigils: ["splitstrike"],
    defaultSigils: 1,
    damage: 1,
    health: 1,
    tribe: "insect",
    rare: false
  },
  "mantisgod": {
    card: "mantisgod",
    name: "Mantis God",
    costType:"blood",
    cost: 1,
    sigils: ["tristrike"],
    defaultSigils: 1,
    damage: 1,
    health: 1,
    tribe: "insect",
    rare: false
  },
  "mole": {
    card: "mole",
    name: "Mole",
    costType:"blood",
    cost: 1,
    sigils: ["whackamole"],
    defaultSigils: 1,
    damage: 0,
    health: 4,
    tribe: "none",
    rare: false
  },
  "moleman": {
    card: "moleman",
    name: "Mole Man",
    costType:"blood",
    cost: 1,
    sigils: ["reach", "whackamole"],
    defaultSigils: 2,
    damage: 0,
    health: 6,
    tribe: "none",
    rare: false
  },
  "moose": {
    card: "moose",
    name: "Moose Buck",
    costType:"blood",
    cost: 3,
    sigils: ["strafepush"],
    defaultSigils: 1,
    damage: 3,
    health: 7,
    tribe: "hooved",
    rare: false
  },
  "mothman_1": {
    card: "mothman_1",
    name: "Strange Larva",
    costType:"blood",
    cost: 1,
    sigils: ["evolve"],
    defaultSigils: 1,
    damage: 0,
    health: 3,
    tribe: "insect",
    rare: false
  },
  "opossum": {
    card: "opossum",
    name: "Opossum",
    costType:"bone",
    cost: 2,
    sigils: [],
    defaultSigils: 0,
    damage: 1,
    health: 1,
    tribe: "none",
    rare: false
  },
  "otter": {
    card: "otter",
    name: "River Otter",
    costType:"blood",
    cost: 1,
    sigils: ["submerge"],
    defaultSigils: 1,
    damage: 1,
    health: 1,
    tribe: "none",
    rare: false
  },
  "ouroboros": {
    card: "ouroboros",
    name: "Ouroboros",
    costType:"blood",
    cost: 2,
    sigils: ["drawcopyondeath", "buffondeath"],
    defaultSigils: 2,
    damage: 1,
    health: 1,
    tribe: "reptile",
    rare: false
  },
  "packrat": {
    card: "packrat",
    name: "Pack Rat",
    costType:"blood",
    cost: 2,
    sigils: ["randomconsumable"],
    defaultSigils: 1,
    damage: 2,
    health: 2,
    tribe: "none",
    rare: false
  },
  "porcupine": {
    card: "porcupine",
    name: "Porcupine",
    costType:"blood",
    cost: 1,
    sigils: ["sharp"],
    defaultSigils: 1,
    damage: 1,
    health: 2,
    tribe: "none",
    rare: false
  },
  "pronghorn": {
    card: "pronghorn",
    name: "Pronghorn",
    costType:"blood",
    cost: 2,
    sigils: ["strafe", "splitstrike"],
    defaultSigils: 2,
    damage: 1,
    health: 3,
    tribe: "hooved",
    rare: false
  },
  "ratking": {
    card: "ratking",
    name: "Rat King",
    costType:"blood",
    cost: 2,
    sigils: ["quadruplebones"],
    defaultSigils: 1,
    damage: 2,
    health: 1,
    tribe: "none",
    rare: false
  },
  "rattler": {
    card: "rattler",
    name: "Rattler",
    costType:"bone",
    cost: 6,
    sigils: [],
    defaultSigils: 0,
    damage: 3,
    health: 1,
    tribe: "reptile",
    rare: false
  },
  "raven": {
    card: "raven",
    name: "Raven",
    costType:"blood",
    cost: 2,
    sigils: ["flying"],
    defaultSigils: 1,
    damage: 2,
    health: 3,
    tribe: "avian",
    rare: false
  },
  "ravenegg": {
    card: "ravenegg",
    name: "Raven Egg",
    costType:"blood",
    cost: 1,
    sigils: ["evolve"],
    defaultSigils: 1,
    damage: 0,
    health: 2,
    tribe: "avian",
    rare: false
  },
  // "ringworm": {
  //   card: "ringworm",
  //   costType:"blood",
  //   cost: 1,
  //   sigils: [],
  //   defaultSigils: 0,
  //   damage: 0,
  //   health: 1,
  //   tribe: "insect",
  //   rare: false
  // },
  "shark": {
    card: "shark",
    name: "Great White",
    costType:"blood",
    cost: 3,
    sigils: ["submerge"],
    defaultSigils: 1,
    damage: 4,
    health: 2,
    tribe: "none",
    rare: false
  },
  "skink": {
    card: "skink",
    name: "Skink",
    costType:"blood",
    cost: 1,
    sigils: ["tailonhit"],
    defaultSigils: 1,
    damage: 1,
    health: 2,
    tribe: "reptile",
    rare: false
  },
  "skunk": {
    card: "skunk",
    name: "Skunk",
    costType:"blood",
    cost: 1,
    sigils: ["debuffenemy"],
    defaultSigils: 1,
    damage: 0,
    health: 3,
    tribe: "none",
    rare: false
  },
  "sparrow": {
    card: "sparrow",
    name: "Sparrow",
    costType:"blood",
    cost: 1,
    sigils: ["flying"],
    defaultSigils: 1,
    damage: 1,
    health: 2,
    tribe: "avian",
    rare: false
  },
  "squidbell": {
    card: "squidbell",
    name: "Bell Tentacle",
    costType:"blood",
    cost: 2,
    sigils: ["loud", "belldamage"],
    defaultSigils: 2,
    damage: 0,
    health: 3,
    tribe: "none",
    rare: false
  },
  "squidcards": {
    card: "squidcards",
    name: "Card Tentacle",
    costType:"blood",
    cost: 1,
    sigils: ["carddamage"],
    defaultSigils: 1,
    damage: 0,
    health: 1,
    tribe: "none",
    rare: false
  },
  "squidmirror": {
    card: "squidmirror",
    name: "Mirror Tentacle",
    costType:"blood",
    cost: 1,
    sigils: ["mirrordamage"],
    defaultSigils: 1,
    damage: 0,
    health: 1,
    tribe: "none",
    rare: false
  },
  "stoat": {
    card: "stoat",
    name: "Stoat",
    costType:"blood",
    cost: 1,
    sigils: [],
    defaultSigils: 0,
    damage: 1,
    health: 2,
    tribe: "none",
    rare: false
  },
  "turtle": {
    card: "turtle",
    name: "River Snapper",
    costType:"blood",
    cost: 2,
    sigils: [],
    defaultSigils: 0,
    damage: 1,
    health: 6,
    tribe: "reptile",
    rare: false
  },
  "urayuli": {
    card: "urayuli",
    name: "Urayuli",
    costType:"blood",
    cost: 4,
    sigils: [],
    defaultSigils: 0,
    damage: 7,
    health: 7,
    tribe: "none",
    rare: false
  },
  "vulture": {
    card: "vulture",
    name: "Turkey Vulture",
    costType:"bone",
    cost: 8,
    sigils: ["flying"],
    defaultSigils: 1,
    damage: 3,
    health: 3,
    tribe: "avian",
    rare: false
  },
  "warren": {
    card: "warren",
    name: "Warren",
    costType:"blood",
    cost: 1,
    sigils: ["drawrabbits"],
    defaultSigils: 1,
    damage: 0,
    health: 2,
    tribe: "none",
    rare: false
  },
  "wolf": {
    card: "wolf",
    name: "Wolf",
    costType:"blood",
    cost: 2,
    sigils: [],
    defaultSigils: 0,
    damage: 3,
    health: 2,
    tribe: "canine",
    rare: false
  },
  "wolfcub": {
    card: "wolfcub",
    name: "Wolf Cub",
    costType:"blood",
    cost: 1,
    sigils: ["evolve"],
    defaultSigils: 1,
    damage: 1,
    health: 1,
    tribe: "canine",
    rare: false
  },
  "direwolf": {
    card: "direwolf",
    name: "Dire Wolf",
    costType:"blood",
    cost: 3,
    sigils: ["doublestrike"],
    defaultSigils: 1,
    damage: 2,
    health: 5,
    tribe: "canine",
    rare: false
  },
  "direwolfcub": {
    card: "direwolfcub",
    name: "Dire Wolf Pup",
    costType:"blood",
    cost: 2,
    sigils: ["bonedigger", "evolve"],
    defaultSigils: 2,
    damage: 1,
    health: 1,
    tribe: "canine",
    rare: false
  },
  "antflying": {
    card: "antflying",
    name: "Flying Ant",
    costType:"blood",
    cost: 1,
    sigils: ["flying", "antdamage"],
    defaultSigils: 2,
    damage: 0,
    health: 1,
    tribe: "insect",
    rare: false
  },
  "kraken": {
    card: "kraken",
    name: "Great Kraken",
    costType:"blood",
    cost: 1,
    sigils: ["submergesquid"],
    defaultSigils: 1,
    damage: 1,
    health: 1,
    tribe: "none",
    rare: false
  },
  "hodag": {
    card: "hodag",
    name: "Hodag",
    costType:"blood",
    cost: 2,
    sigils: ["gainattackonkillpermanent"],
    defaultSigils: 1,
    damage: 1,
    health: 5,
    tribe: "none",
    rare: false
  },
  "lammergeier": {
    card: "lammergeier",
    name: "Lammergeier", 
    costType:"blood",
    cost: 3,
    sigils: ["flying", "bonedamage"],
    defaultSigils: 2,
    damage: 0,
    health: 4,
    tribe: "avian",
    rare: false
  },
  "mealworm": {
    card: "mealworm",
    name: "Mealworm",
    costType:"bone",
    cost: 2,
    sigils: ["morsel"],
    defaultSigils: 1,
    damage: 0,
    health: 2,
    tribe: "insect",
    rare: false
  },
  "mudturtle": {
    card: "mudturtle",
    name: "Mud Turtle",
    costType:"blood",
    cost: 2,
    sigils: ["deathshield"],
    defaultSigils: 1,
    damage: 2,
    health: 2,
    tribe: "reptile",
    rare: false
  },
  "raccoon": {
    card: "raccoon",
    name: "Raccoon",
    costType:"blood",
    cost: 1,
    sigils: ["opponentbones"],
    defaultSigils: 1,
    damage: 1,
    health: 1,
    tribe: "none",
    rare: false
  },
  "redhart": {
    card: "redhart",
    name: "Red Hart",
    costType:"blood",
    cost: 2,
    sigils: ["strafe", "sacdamage"],
    defaultSigils: 2,
    damage: 0,
    health: 2,
    tribe: "hooved",
    rare: false
  },
  "tadpole": {
    card: "tadpole",
    name: "Tadpole",
    costType:"bone",
    cost: 0,
    sigils: ["submerge", "evolve"],
    defaultSigils: 2,
    damage: 0,
    health: 1,
    tribe: "reptile",
    rare: false
  },
  "bull": {
    card: "bull",
    name: "Wild Bull",
    costType:"blood",
    cost: 2,
    sigils: ["strafeswap"],
    defaultSigils: 1,
    damage: 3,
    health: 2,
    tribe: "hooved",
    rare: false
  },
  "wolverine": {
    card: "wolverine",
    name: "Wolverine",
    costType:"bone",
    cost: 5,
    sigils: ["gainattackonkill"],
    defaultSigils: 1,
    damage: 1,
    health: 3,
    tribe: "none",
    rare: false
  }
}

let allSigils = [
  'deathtouch',  'buffneighbours',
  'drawant',     'flying',          'createdams',
  'beesonhit',   'guarddog',        'reach',
  'sacrificial', 'drawcopyondeath', 'createbells',
  'strafe',      'evolve',          'drawcopy',
  'tripleblood', 'submerge',        'corpseeater',
  'tutor',       'splitstrike',     'tristrike',
  'whackamole',  'strafepush',      'randomconsumable',
  'sharp',       'quadruplebones',  'tailonhit',
  'debuffenemy', 'drawrabbits',     'doublestrike',
  'bonedigger',  'submergesquid',   'gainattackonkill',
  'morsel',      'deathshield',     'opponentbones',
  'strafeswap'
]

module.exports = {allCards: allCards, allSigils: allSigils}

//custom sigils for traits - "loud", "buffondeath", "gainattackonkillpermanent", "sacrificialswap", "belldamage", "carddamage", "mirrordamage", "sacdamage", "bonedamage"
//FIXME - add in long elk? dont have the files for it atm