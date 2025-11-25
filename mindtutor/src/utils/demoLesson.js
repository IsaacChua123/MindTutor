// demoLesson.js - Pre-installed interactive demo lesson for judges

export const DEMO_LESSON = {
  topic: 'Interactive Biology: Cell Structure & Function',
  keywords: [
    'cell',
    'nucleus',
    'mitochondria',
    'membrane',
    'organelle',
    'eukaryotic',
    'prokaryotic',
    'diffusion',
    'osmosis',
    'photosynthesis',
  ],
  concepts: [
    {
      concept: 'Cell Theory',
      definition:
        'All living organisms are composed of one or more cells, the cell is the basic unit of life, and all cells arise from pre-existing cells.',
      difficulty: 2,
      interactiveElements: {
        type: 'flashcards',
        content: [
          {
            front: 'Who proposed the cell theory?',
            back: 'Schleiden, Schwann, and Virchow',
          },
          {
            front: 'What are the 3 parts of cell theory?',
            back: '1. All living things made of cells, 2. Cell is basic unit of life, 3. Cells come from cells',
          },
        ],
      },
    },
    {
      concept: 'Cell Membrane',
      definition:
        'A selectively permeable barrier that controls what enters and leaves the cell, maintaining homeostasis.',
      difficulty: 3,
      interactiveElements: {
        type: 'simulation',
        content: {
          scenario:
            "Imagine you're the cell membrane. Decide what substances can enter!",
          questions: [
            {
              substance: 'Water',
              shouldAllow: true,
              explanation: 'Water can pass through via osmosis',
            },
            {
              substance: 'Large protein',
              shouldAllow: false,
              explanation: 'Too large to pass through membrane pores',
            },
            {
              substance: 'Oxygen gas',
              shouldAllow: true,
              explanation: 'Small molecules can diffuse through',
            },
          ],
        },
      },
    },
    {
      concept: 'Mitochondria',
      definition:
        'The powerhouse of the cell, responsible for producing ATP through cellular respiration.',
      difficulty: 2,
      interactiveElements: {
        type: 'analogy',
        content: {
          question: 'What would mitochondria be in a city?',
          options: [
            { text: 'Power plant', correct: true },
            { text: 'City hall', correct: false },
            { text: 'School', correct: false },
            { text: 'Hospital', correct: false },
          ],
          explanation:
            'Mitochondria generate energy (ATP) just like power plants generate electricity!',
        },
      },
    },
    {
      concept: 'Photosynthesis',
      definition:
        'The process by which plants convert light energy into chemical energy stored in glucose.',
      difficulty: 3,
      interactiveElements: {
        type: 'matching',
        content: {
          title: 'Match the reactants and products of photosynthesis',
          pairs: [
            { reactant: 'Carbon Dioxide', product: 'Glucose' },
            { reactant: 'Water', product: 'Oxygen' },
            { reactant: 'Light Energy', product: 'Chemical Energy' },
          ],
        },
      },
    },
  ],
  raw: `CELL STRUCTURE AND FUNCTION

INTRODUCTION TO CELLS
Cells are the basic building blocks of all living organisms. The cell theory states that all living organisms are composed of cells, the cell is the basic unit of life, and all cells arise from pre-existing cells.

CELL MEMBRANE
The cell membrane is a selectively permeable barrier that controls what enters and leaves the cell. It is made of a phospholipid bilayer with embedded proteins that act as channels, carriers, and receptors. The cell membrane maintains homeostasis by regulating the movement of substances.

MITOCHONDRIA
Mitochondria are the powerhouses of the cell, responsible for producing ATP through cellular respiration. They have their own DNA and are thought to have originated from ancient symbiotic bacteria. Cells that require high energy, such as muscle cells, contain many mitochondria.

PHOTOSYNTHESIS
Photosynthesis is the process by which plants convert light energy into chemical energy. It occurs in chloroplasts, which contain chlorophyll. The process uses carbon dioxide and water to produce glucose and oxygen. Photosynthesis is essential for life on Earth as it provides oxygen and forms the base of most food chains.

CELL THEORY
The cell theory is one of the fundamental principles of biology. It consists of three main points: 1) All living organisms are made of cells, 2) The cell is the basic unit of structure and function, and 3) All cells come from pre-existing cells through cell division.

NUCLEUS
The nucleus is the control center of the cell, containing the cell's genetic material (DNA) organized into chromosomes. It controls all cellular activities by regulating which proteins are produced. The nucleus is surrounded by a nuclear envelope with pores that allow communication with the cytoplasm.

RIBOSOMES
Ribosomes are molecular machines that synthesize proteins. They can be found free in the cytoplasm or attached to the endoplasmic reticulum. Ribosomes read messenger RNA and assemble amino acids into polypeptide chains according to the genetic code.

ENDOPLASMIC RETICULUM
The endoplasmic reticulum is a network of membranes that extends from the nuclear envelope. Rough ER is studded with ribosomes and involved in protein synthesis, while smooth ER is involved in lipid synthesis and detoxification.

GOLGI APPARATUS
The Golgi apparatus modifies, sorts, and packages proteins and lipids for transport to their destinations. It consists of flattened membrane-bound sacs called cisternae. Proteins from the ER are processed and packaged into vesicles for transport.`,
  explanation: `# Cell Structure and Function

## Overview

Cells are the fundamental units of life, serving as the building blocks for all living organisms. Understanding cell structure and function is essential for comprehending how living systems work at their most basic level.

## Cell Theory

The cell theory is the foundation of modern biology and consists of three key principles:

1. **All living organisms are composed of cells** - Every living thing, from single-celled bacteria to complex multicellular organisms like humans, is made up of cells.

2. **The cell is the basic unit of structure and function** - Cells are the smallest units that can carry out all the processes necessary for life.

3. **All cells arise from pre-existing cells** - New cells are formed through the division of existing cells, maintaining the continuity of life.

## Cell Membrane

The cell membrane, also known as the plasma membrane, is a selectively permeable barrier that surrounds every cell. Its primary functions include:

- **Controlling substance movement** - The membrane regulates what enters and leaves the cell
- **Maintaining homeostasis** - It helps maintain the cell's internal environment
- **Cell signaling** - Membrane proteins receive and transmit signals from the environment

The cell membrane is composed of a phospholipid bilayer with embedded proteins, cholesterol, and carbohydrates.

## Mitochondria

Mitochondria are often called the "powerhouses" of the cell because they generate most of the cell's energy. Key features include:

- **ATP production** - Mitochondria convert chemical energy from nutrients into ATP through cellular respiration
- **Energy conversion** - They transform energy from food into a form cells can use
- **Own DNA** - Mitochondria have their own genetic material, supporting the endosymbiotic theory

Cells that require high energy levels, such as muscle cells and neurons, contain numerous mitochondria.

## Photosynthesis in Plant Cells

Photosynthesis is the process by which plants and some other organisms convert light energy into chemical energy. This vital process:

- **Captures light energy** - Chlorophyll in chloroplasts absorbs sunlight
- **Produces glucose** - Carbon dioxide and water are converted into glucose and oxygen
- **Supports life** - Photosynthesis provides oxygen and forms the foundation of most food chains

## Nucleus and Genetic Control

The nucleus serves as the cell's control center:

- **Contains DNA** - Genetic material is organized into linear chromosomes
- **Controls protein synthesis** - Directs which proteins the cell produces
- **Regulates cell activities** - Oversees all cellular functions and reproduction

## Protein Synthesis Machinery

Several organelles work together for protein synthesis:

- **Ribosomes** - Molecular machines that assemble amino acids into proteins
- **Endoplasmic reticulum** - Network of membranes for protein and lipid processing
- **Golgi apparatus** - Modifies and packages proteins for transport

## Cell Specialization

Different cell types have specialized structures for specific functions:

- **Muscle cells** - Contain many mitochondria and contractile proteins
- **Nerve cells** - Have long extensions for signal transmission
- **Red blood cells** - Specialized for oxygen transport
- **Root hair cells** - Adapted for water and mineral absorption

Understanding these cellular structures and their functions provides the foundation for comprehending how organisms function at all levels of biological organization.`,
  interactiveFeatures: {
    progressTracking: true,
    gamification: {
      points: true,
      badges: ['Cell Explorer', 'Membrane Master', 'Energy Expert'],
      achievements: [
        {
          name: 'First Concept Mastered',
          description: 'Complete your first interactive concept',
          points: 10,
        },
        {
          name: 'Simulation Champion',
          description: 'Successfully complete all membrane simulations',
          points: 25,
        },
        {
          name: 'Biology Wizard',
          description: 'Master all concepts in this lesson',
          points: 50,
        },
      ],
    },
    adaptiveLearning: {
      difficultyAdjustment: true,
      personalizedHints: true,
      conceptConnections: true,
    },
  },
  createdAt: new Date().toISOString(),
  isDemo: true,
  estimatedTime: '15-20 minutes',
};

// Function to load the demo lesson into the app
export function loadDemoLesson() {
  return {
    'Interactive Biology Demo': DEMO_LESSON,
  };
}

// Interactive element types
export const INTERACTIVE_TYPES = {
  FLASHCARDS: 'flashcards',
  SIMULATION: 'simulation',
  ANALOGY: 'analogy',
  MATCHING: 'matching',
  QUIZ: 'quiz',
  DRAG_DROP: 'drag_drop',
};
