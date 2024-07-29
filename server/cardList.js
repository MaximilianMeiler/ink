let allCards = {
  "adder": {
    card: "adder",
    costType:"blood",
    cost: 2,
    sigils: ["deathtouch"],
    damage: 1,
    health: 1,
    tribe: "reptile",
    rare: false
  },
  "alpha": {
    card: "alpha",
    costType:"bone",
    cost: 4,
    sigils: ["buffneighbours"],
    damage: 1,
    health: 2,
    tribe: "canine",
    rare: false
  },
  "amalgam": {
    card: "amalgam",
    costType:"blood",
    cost: 2,
    sigils: [],
    damage: 3,
    health: 3,
    tribe: "all",
    rare: false
  },
  "amoeba": {
    card: "amoeba",
    costType:"bone",
    cost: 2,
    sigils: ["randomability"],
    damage: 1,
    health: 2,
    tribe: "none",
    rare: false
  },
  "ant": {
    card: "ant",
    costType:"blood",
    cost: 1,
    sigils: [],
    damage: -5,
    health: 2,
    tribe: "insect",
    rare: false
  },
  "antqueen": {
    card: "antqueen",
    costType:"blood",
    cost: 2,
    sigils: ["drawant"],
    damage: -5,
    health: 3,
    tribe: "insect",
    rare: false
  },
  "bat": {
    card: "bat",
    costType:"bone",
    cost: 4,
    sigils: ["flying"],
    damage: 2,
    health: 1,
    tribe: "none",
    rare: false
  },
  "beaver": {
    card: "beaver",
    costType:"blood",
    cost: 2,
    sigils: ["createdams"],
    damage: 1,
    health: 4,
    tribe: "none",
    rare: false
  },
  "beehive": {
    card: "beehive",
    costType:"blood",
    cost: 1,
    sigils: ["beesonhit"],
    damage: 0,
    health: 2,
    tribe: "insect",
    rare: false
  },
  "bloodhound": {
    card: "bloodhound",
    costType:"blood",
    cost: 2,
    sigils: ["guarddog"],
    damage: 2,
    health: 3,
    tribe: "canine",
    rare: false
  },
  "bullfrog": {
    card: "bullfrog",
    costType:"blood",
    cost: 1,
    sigils: ["reach"],
    damage: 1,
    health: 2,
    tribe: "reptile",
    rare: false
  },
  "cat": {
    card: "cat",
    costType:"blood",
    cost: 1,
    sigils: ["sacrificial"],
    damage: 0,
    health: 1,
    tribe: "none",
    rare: false
  },
  "cockroach": {
    card: "cockroach",
    costType:"bone",
    cost: 4,
    sigils: ["drawcopyondeath"],
    damage: 1,
    health: 1,
    tribe: "insect",
    rare: false
  },
  "coyote": {
    card: "coyote",
    costType:"bone",
    cost: 4,
    sigils: [],
    damage: 2,
    health: 1,
    tribe: "canine",
    rare: false
  },
  "daus": {
    card: "daus",
    costType:"blood",
    cost: 2,
    sigils: ["createbells"],
    damage: 2,
    health: 2,
    tribe: "hooved",
    rare: false
  },
  "deer": {
    card: "deer",
    costType:"blood",
    cost: 2,
    sigils: ["strafe"],
    damage: 2,
    health: 4,
    tribe: "hooved",
    rare: false
  },
  "deercub": {
    card: "deercub",
    costType:"blood",
    cost: 1,
    sigils: ["strafe", "evolve"],
    damage: 1,
    health: 1,
    tribe: "hooved",
    rare: false
  },
  "fieldmice": {
    card: "fieldmice",
    costType:"blood",
    cost: 2,
    sigils: ["drawcopy"],
    damage: 2,
    health: 2,
    tribe: "none  ",
    rare: false
  },
  "geck": {
    card: "geck",
    costType:"bone",
    cost: 0,
    sigils: [],
    damage: 1,
    health: 1,
    tribe: "reptile",
    rare: false
  },
  "goat": {
    card: "goat",
    costType:"blood",
    cost: 1,
    sigils: ["tripleblood"],
    damage: 0,
    health: 1,
    tribe: "hooved",
    rare: false
  },
  "grizzly": {
    card: "grizzly",
    costType:"blood",
    cost: 3,
    sigils: [],
    damage: 4,
    health: 6,
    tribe: "none",
    rare: false
  },
  "jerseydevil_sleeping": {
    card: "jerseydevil_sleeping",
    costType:"blood",
    cost: 1,
    sigils: ["sacrificial"],
    damage: 0,
    health: 1,
    tribe: "hooved",
    rare: false
  },
  "kingfisher": {
    card: "kingfisher",
    costType:"blood",
    cost: 1,
    sigils: ["flying", "submerge"],
    damage: 1,
    health: 1,
    tribe: "avian",
    rare: false
  },
  "maggots": {
    card: "maggots",
    costType:"bone",
    cost: 5,
    sigils: ["corpseeater"],
    damage: 1,
    health: 2,
    tribe: "insect",
    rare: false
  },
  "magpie": {
    card: "magpie",
    costType:"blood",
    cost: 2,
    sigils: ["flying", "tutor"],
    damage: 1,
    health: 1,
    tribe: "avian",
    rare: false
  },
  "mantis": {
    card: "mantis",
    costType:"blood",
    cost: 1,
    sigils: ["splitstrike"],
    damage: 1,
    health: 1,
    tribe: "insect",
    rare: false
  },
  "mantisgod": {
    card: "mantisgod",
    costType:"blood",
    cost: 1,
    sigils: ["tristrike"],
    damage: 1,
    health: 1,
    tribe: "insect",
    rare: false
  },
  "mole": {
    card: "mole",
    costType:"blood",
    cost: 1,
    sigils: ["whackamole"],
    damage: 0,
    health: 4,
    tribe: "none",
    rare: false
  },
  "moleman": {
    card: "moleman",
    costType:"blood",
    cost: 1,
    sigils: ["reach", "whackamole"],
    damage: 0,
    health: 6,
    tribe: "none",
    rare: false
  },
  "moose": {
    card: "moose",
    costType:"blood",
    cost: 3,
    sigils: ["strafepush"],
    damage: 3,
    health: 7,
    tribe: "hooved",
    rare: false
  },
  "mothman_1": {
    card: "mothman_1",
    costType:"blood",
    cost: 1,
    sigils: ["evolve"],
    damage: 0,
    health: 3,
    tribe: "insect",
    rare: false
  },
  "opossum": {
    card: "opossum",
    costType:"bone",
    cost: 2,
    sigils: [],
    damage: 1,
    health: 1,
    tribe: "none",
    rare: false
  },
  "otter": {
    card: "otter",
    costType:"blood",
    cost: 1,
    sigils: ["submerge"],
    damage: 1,
    health: 1,
    tribe: "none",
    rare: false
  },
  "ouroboros": {
    card: "ouroboros",
    costType:"blood",
    cost: 2,
    sigils: ["drawcopyondeath"],
    damage: 1,
    health: 1,
    tribe: "reptile",
    rare: false
  },
  "packrat": {
    card: "packrat",
    costType:"blood",
    cost: 2,
    sigils: ["randomconsumable"],
    damage: 2,
    health: 2,
    tribe: "none",
    rare: false
  },
  "porcupine": {
    card: "porcupine",
    costType:"blood",
    cost: 1,
    sigils: ["sharp"],
    damage: 1,
    health: 2,
    tribe: "none",
    rare: false
  },
  "pronghorn": {
    card: "pronghorn",
    costType:"blood",
    cost: 2,
    sigils: ["strafe", "splitstrike"],
    damage: 1,
    health: 3,
    tribe: "hooved",
    rare: false
  },
  "ratking": {
    card: "ratking",
    costType:"blood",
    cost: 2,
    sigils: ["quadruplebones"],
    damage: 2,
    health: 1,
    tribe: "none",
    rare: false
  },
  "rattler": {
    card: "rattler",
    costType:"bone",
    cost: 6,
    sigils: [],
    damage: 3,
    health: 1,
    tribe: "reptile",
    rare: false
  },
  "raven": {
    card: "raven",
    costType:"blood",
    cost: 2,
    sigils: ["flying"],
    damage: 2,
    health: 3,
    tribe: "avian",
    rare: false
  },
  "ravenegg": {
    card: "ravenegg",
    costType:"blood",
    cost: 1,
    sigils: ["evolve"],
    damage: 0,
    health: 2,
    tribe: "avian",
    rare: false
  },
  "ringworm": {
    card: "ringworm",
    costType:"blood",
    cost: 1,
    sigils: [],
    damage: 0,
    health: 1,
    tribe: "insect",
    rare: false
  },
  "shark": {
    card: "shark",
    costType:"blood",
    cost: 3,
    sigils: ["submerge"],
    damage: 4,
    health: 2,
    tribe: "none",
    rare: false
  },
  "skink": {
    card: "skink",
    costType:"blood",
    cost: 1,
    sigils: ["tailonhit"],
    damage: 1,
    health: 2,
    tribe: "reptile",
    rare: false
  },
  "skunk": {
    card: "skunk",
    costType:"blood",
    cost: 1,
    sigils: ["debuffenemy"],
    damage: 0,
    health: 3,
    tribe: "none",
    rare: false
  },
  "sparrow": {
    card: "sparrow",
    costType:"blood",
    cost: 1,
    sigils: ["flying"],
    damage: 1,
    health: 2,
    tribe: "avian",
    rare: false
  },
  "squidbell": {
    card: "squidbell",
    costType:"blood",
    cost: 2,
    sigils: [],
    damage: -6,
    health: 3,
    tribe: "none",
    rare: false
  },
  "squidcards": {
    card: "squidcards",
    costType:"blood",
    cost: 1,
    sigils: [],
    damage: -7,
    health: 1,
    tribe: "none",
    rare: false
  },
  "squidmirror": {
    card: "squidmirror",
    costType:"blood",
    cost: 1,
    sigils: [],
    damage: -8,
    health: 1,
    tribe: "none",
    rare: false
  },
  "stoat": {
    card: "stoat",
    costType:"blood",
    cost: 1,
    sigils: [],
    damage: 1,
    health: 2,
    tribe: "none",
    rare: false
  },
  "turtle": {
    card: "turtle",
    costType:"blood",
    cost: 2,
    sigils: [],
    damage: 1,
    health: 6,
    tribe: "reptile",
    rare: false
  },
  "urayuli": {
    card: "urayuli",
    costType:"blood",
    cost: 4,
    sigils: [],
    damage: 7,
    health: 7,
    tribe: "none",
    rare: false
  },
  "vulture": {
    card: "vulture",
    costType:"bone",
    cost: 8,
    sigils: ["flying"],
    damage: 3,
    health: 3,
    tribe: "avian",
    rare: false
  },
  "warren": {
    card: "warren",
    costType:"blood",
    cost: 1,
    sigils: ["drawrabbits"],
    damage: 0,
    health: 2,
    tribe: "none",
    rare: false
  },
  "wolf": {
    card: "wolf",
    costType:"blood",
    cost: 2,
    sigils: [],
    damage: 3,
    health: 2,
    tribe: "canine",
    rare: false
  },
  "wolfcub": {
    card: "wolfcub",
    costType:"blood",
    cost: 1,
    sigils: ["evolve"],
    damage: 1,
    health: 1,
    tribe: "canine",
    rare: false
  },
  "direwolf": {
    card: "direwolf",
    costType:"blood",
    cost: 3,
    sigils: ["doublestrike"],
    damage: 2,
    health: 5,
    tribe: "canine",
    rare: false
  },
  "direwolfcub": {
    card: "direwolfcub",
    costType:"blood",
    cost: 2,
    sigils: ["bonedigger", "evolve"],
    damage: 1,
    health: 1,
    tribe: "canine",
    rare: false
  },
  "antflying": {
    card: "antflying",
    costType:"blood",
    cost: 1,
    sigils: ["flying"],
    damage: -5,
    health: 1,
    tribe: "insect",
    rare: false
  },
  "kraken": {
    card: "kraken",
    costType:"blood",
    cost: 1,
    sigils: ["submergesquid"],
    damage: 1,
    health: 1,
    tribe: "none",
    rare: false
  },
  "hodag": {
    card: "hodag",
    costType:"blood",
    cost: 2,
    sigils: ["gainattackonkill"],
    damage: 1,
    health: 5,
    tribe: "none",
    rare: false
  },
  "lammergeier": {
    card: "lammergeier",
    costType:"blood",
    cost: 3,
    sigils: ["flying"],
    damage: -9,
    health: 4,
    tribe: "avian",
    rare: false
  },
  "mealworm": {
    card: "mealworm",
    costType:"bone",
    cost: 2,
    sigils: ["morsel"],
    damage: 0,
    health: 2,
    tribe: "insect",
    rare: false
  },
  "mudturtle": {
    card: "mudturtle",
    costType:"blood",
    cost: 2,
    sigils: ["deathshield"],
    damage: 2,
    health: 2,
    tribe: "reptile",
    rare: false
  },
  "raccoon": {
    card: "raccoon",
    costType:"blood",
    cost: 1,
    sigils: ["opponentbones"],
    damage: 1,
    health: 1,
    tribe: "none",
    rare: false
  },
  "redhart": {
    card: "redhart",
    costType:"blood",
    cost: 2,
    sigils: ["strafe"],
    damage: -10,
    health: 2,
    tribe: "hooved",
    rare: false
  },
  "tadpole": {
    card: "tadpole",
    costType:"bone",
    cost: 0,
    sigils: ["submerge", "evolve"],
    damage: 0,
    health: 1,
    tribe: "reptile",
    rare: false
  },
  "bull": {
    card: "bull",
    costType:"blood",
    cost: 2,
    sigils: ["strafeswap"],
    damage: 3,
    health: 2,
    tribe: "hooved",
    rare: false
  },
  "wolverine": {
    card: "wolverine",
    costType:"bone",
    cost: 5,
    sigils: ["gainattackonkill"],
    damage: 1,
    health: 3,
    tribe: "none",
    rare: false
  }
}

module.exports = {allCards: allCards}