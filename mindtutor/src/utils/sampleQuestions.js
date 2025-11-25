// sampleQuestions.js - Pre-installed sample questions for immediate use

export const SAMPLE_QUESTIONS = {
  'Biology - Cells and Organization': {
    topic: 'Biology - Cells and Organization',
    questions: [
      {
        id: 'sample_bio_1',
        type: 'mcq',
        question: 'What is the main function of mitochondria in a cell?',
        options: [
          'To produce energy through aerobic respiration',
          'To control cell activities',
          'To synthesize proteins',
          'To store genetic information',
        ],
        answer: 'To produce energy through aerobic respiration',
        difficulty: 2,
        conceptTested: 'Mitochondria',
        explanation:
          'Mitochondria are the powerhouses of the cell. They carry out aerobic respiration, releasing energy from glucose to produce ATP.',
      },
      {
        id: 'sample_bio_2',
        type: 'mcq',
        question:
          'Which structure is found in plant cells but NOT in animal cells?',
        options: ['Cell wall', 'Cell membrane', 'Nucleus', 'Mitochondria'],
        answer: 'Cell wall',
        difficulty: 1,
        conceptTested: 'Plant cell structures',
        explanation:
          'Plant cells have a rigid cell wall made of cellulose that provides structural support. Animal cells only have a flexible cell membrane.',
      },
      {
        id: 'sample_bio_3',
        type: 'truefalse',
        question:
          'Bacterial cells have a true nucleus enclosed by a nuclear membrane.',
        answer: false,
        difficulty: 2,
        conceptTested: 'Bacterial cells',
        explanation:
          'Bacterial cells are prokaryotic and do not have a true nucleus. Their DNA floats freely in the cytoplasm.',
      },
      {
        id: 'sample_bio_4',
        type: 'mcq',
        question: 'What is osmosis?',
        options: [
          'The movement of water molecules from high to low water concentration through a partially permeable membrane',
          'The movement of any particles from high to low concentration',
          'The movement of substances against a concentration gradient using energy',
          'The breakdown of large molecules into smaller ones',
        ],
        answer:
          'The movement of water molecules from high to low water concentration through a partially permeable membrane',
        difficulty: 3,
        conceptTested: 'Osmosis',
        explanation:
          'Osmosis is specifically the movement of water molecules through a partially permeable membrane, from a dilute solution to a concentrated solution.',
      },
      {
        id: 'sample_bio_5',
        type: 'fillblank',
        question:
          '_____ is the process by which a cell divides to produce two identical daughter cells.',
        answer: 'Mitosis',
        difficulty: 2,
        conceptTested: 'Cell division',
        explanation:
          'Mitosis is the process of cell division that produces two genetically identical daughter cells, used for growth and repair.',
      },
      {
        id: 'sample_bio_6',
        type: 'mcq',
        question: 'Which specialized cell is adapted for transporting oxygen?',
        options: [
          'Red blood cell',
          'Nerve cell',
          'Muscle cell',
          'Root hair cell',
        ],
        answer: 'Red blood cell',
        difficulty: 1,
        conceptTested: 'Specialized cells',
        explanation:
          'Red blood cells have a biconcave shape and contain hemoglobin to efficiently transport oxygen around the body.',
      },
      {
        id: 'sample_bio_7',
        type: 'truefalse',
        question: 'Active transport requires energy from respiration.',
        answer: true,
        difficulty: 2,
        conceptTested: 'Active transport',
        explanation:
          'Active transport moves substances against their concentration gradient, which requires energy from ATP produced during respiration.',
      },
      {
        id: 'sample_bio_8',
        type: 'mcq',
        question:
          'What is the correct order of organization in multicellular organisms?',
        options: [
          'Cells → Tissues → Organs → Organ Systems → Organism',
          'Tissues → Cells → Organs → Organ Systems → Organism',
          'Cells → Organs → Tissues → Organ Systems → Organism',
          'Organs → Tissues → Cells → Organ Systems → Organism',
        ],
        answer: 'Cells → Tissues → Organs → Organ Systems → Organism',
        difficulty: 2,
        conceptTested: 'Levels of organization',
        explanation:
          'The hierarchy of organization starts with cells, which form tissues, which form organs, which form organ systems, which make up the complete organism.',
      },
      {
        id: 'sample_bio_9',
        type: 'shortanswer',
        question: 'Explain why root hair cells have many mitochondria.',
        answer:
          'Root hair cells need many mitochondria to provide energy for active transport. They actively transport mineral ions from the soil into the cell against the concentration gradient, which requires ATP energy produced by mitochondria.',
        difficulty: 3,
        conceptTested: 'Root hair cells',
        guidance:
          'Your answer should mention active transport and energy requirements.',
        explanation:
          'Root hair cells use active transport to absorb minerals from soil where the concentration is lower than inside the cell. This process requires lots of energy (ATP) which is produced by mitochondria.',
      },
      {
        id: 'sample_bio_10',
        type: 'mcq',
        question: 'What happens to a plant cell when placed in pure water?',
        options: [
          'It becomes turgid (swollen and firm)',
          'It bursts',
          'It becomes plasmolysed',
          'Nothing happens',
        ],
        answer: 'It becomes turgid (swollen and firm)',
        difficulty: 3,
        conceptTested: 'Osmosis in plant cells',
        explanation:
          'Water enters the plant cell by osmosis, making it turgid. The cell wall prevents it from bursting, unlike animal cells.',
      },
    ],
  },

  'Chemistry - Atomic Structure': {
    topic: 'Chemistry - Atomic Structure',
    questions: [
      {
        id: 'sample_chem_1',
        type: 'mcq',
        question: 'What is an atom?',
        options: [
          'The smallest particle of an element that retains its chemical properties',
          'A particle with a positive charge',
          'A molecule made of different elements',
          'The nucleus of an element',
        ],
        answer:
          'The smallest particle of an element that retains its chemical properties',
        difficulty: 1,
        conceptTested: 'Atoms',
        explanation:
          'An atom is the smallest unit of an element that still has the properties of that element.',
      },
      {
        id: 'sample_chem_2',
        type: 'mcq',
        question: 'Where is most of the mass of an atom concentrated?',
        options: [
          'In the nucleus',
          'In the electron shells',
          'Evenly distributed throughout',
          'In the outermost shell',
        ],
        answer: 'In the nucleus',
        difficulty: 2,
        conceptTested: 'Atomic structure',
        explanation:
          "The nucleus contains protons and neutrons, which account for almost all of the atom's mass. Electrons have negligible mass.",
      },
      {
        id: 'sample_chem_3',
        type: 'fillblank',
        question:
          'The atomic number of an element is equal to the number of _____ in its nucleus.',
        answer: 'protons',
        difficulty: 2,
        conceptTested: 'Atomic number',
        explanation:
          'The atomic number is defined as the number of protons in the nucleus of an atom.',
      },
      {
        id: 'sample_chem_4',
        type: 'truefalse',
        question:
          'Isotopes of an element have the same number of neutrons but different numbers of protons.',
        answer: false,
        difficulty: 3,
        conceptTested: 'Isotopes',
        explanation:
          'Isotopes have the same number of protons (same element) but different numbers of neutrons.',
      },
      {
        id: 'sample_chem_5',
        type: 'mcq',
        question:
          'What is the maximum number of electrons that can occupy the first electron shell?',
        options: ['2', '8', '18', '32'],
        answer: '2',
        difficulty: 2,
        conceptTested: 'Electron shells',
        explanation:
          'The first electron shell can hold a maximum of 2 electrons. The second shell can hold 8, and the third can hold 18.',
      },
    ],
  },

  'Physics - Forces and Motion': {
    topic: 'Physics - Forces and Motion',
    questions: [
      {
        id: 'sample_phys_1',
        type: 'mcq',
        question: 'What is the SI unit of force?',
        options: ['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'],
        answer: 'Newton (N)',
        difficulty: 1,
        conceptTested: 'Force units',
        explanation:
          'The Newton (N) is the SI unit of force, named after Sir Isaac Newton.',
      },
      {
        id: 'sample_phys_2',
        type: 'mcq',
        question:
          "According to Newton's First Law, an object will remain at rest or continue moving at constant velocity unless acted upon by:",
        options: [
          'An unbalanced force',
          'Gravity',
          'Friction',
          'Air resistance',
        ],
        answer: 'An unbalanced force',
        difficulty: 2,
        conceptTested: "Newton's First Law",
        explanation:
          "Newton's First Law states that an object will maintain its state of motion unless acted upon by an unbalanced (net) force.",
      },
      {
        id: 'sample_phys_3',
        type: 'fillblank',
        question: 'The formula for calculating speed is: Speed = _____ ÷ Time',
        answer: 'Distance',
        difficulty: 1,
        conceptTested: 'Speed calculation',
        explanation:
          'Speed is calculated by dividing the distance traveled by the time taken: Speed = Distance ÷ Time',
      },
      {
        id: 'sample_phys_4',
        type: 'truefalse',
        question: 'Acceleration is the rate of change of velocity.',
        answer: true,
        difficulty: 2,
        conceptTested: 'Acceleration',
        explanation:
          'Acceleration is defined as the rate at which velocity changes with time.',
      },
      {
        id: 'sample_phys_5',
        type: 'mcq',
        question:
          'What is the resultant force when a 10N force acts to the right and a 4N force acts to the left on the same object?',
        options: [
          '6N to the right',
          '14N to the right',
          '6N to the left',
          '14N to the left',
        ],
        answer: '6N to the right',
        difficulty: 2,
        conceptTested: 'Resultant forces',
        explanation:
          'Resultant force = 10N - 4N = 6N in the direction of the larger force (to the right).',
      },
    ],
  },
};

/**
 * Get all available sample quiz topics
 * @returns {Array<string>} - Array of topic names
 */
export function getSampleTopics() {
  return Object.keys(SAMPLE_QUESTIONS);
}

/**
 * Get sample questions for a specific topic
 * @param {string} topicName - Name of the topic
 * @returns {Object|null} - Quiz object or null if not found
 */
export function getSampleQuiz(topicName) {
  return SAMPLE_QUESTIONS[topicName] || null;
}

/**
 * Get all sample quizzes
 * @returns {Object} - All sample quizzes
 */
export function getAllSampleQuizzes() {
  return SAMPLE_QUESTIONS;
}
