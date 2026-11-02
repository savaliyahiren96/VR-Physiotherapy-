export interface QuizQuestion {
  id: string;
  category: 'Prime Movers' | 'End-Feel' | 'Accessory Glides' | 'Biomechanics & Torque' | '3D Spotting';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  citation: string;
  isSpotting?: boolean;
  spottingTarget?: string; // Muscle ID or Landmark name to locate in 3D
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: 'Prime Movers',
    question: 'Which muscle serves as the primary prime mover for elbow flexion regardless of forearm pronation or supination position?',
    options: [
      'Biceps Brachii',
      'Brachialis ("Workhorse of the elbow")',
      'Brachioradialis',
      'Pronator Teres',
    ],
    correctIndex: 1,
    explanation: 'The Brachialis originates on the distal anterior humerus and inserts into the ulnar tuberosity and coronoid process. Because the ulna does not rotate during pronation/supination, its moment arm and line of action remain constant in all forearm positions.',
    citation: 'Holzbaur et al. (2005); Neumann DA. Kinesiology of the Musculoskeletal System.',
  },
  {
    id: 'q2',
    category: 'Biomechanics & Torque',
    question: 'When the elbow is held at 90° flexion with a 2 kg dumbbell in hand (60 kg body mass), why does internal muscle force exceed external load force by more than 8-fold?',
    options: [
      'The elbow is a 3rd class lever with effort moment arm (~0.035 m) much smaller than load moment arm (~0.305 m)',
      'The biceps tendon pulls at an oblique 180° angle',
      'Winter\'s segment mass exceeds the weight of the trunk',
      'Because joint friction absorbs 80% of muscle force',
    ],
    correctIndex: 0,
    explanation: 'In a 3rd class lever (Effort between Fulcrum and Load), mechanical advantage is MA = r_effort / r_load = 0.035 / 0.305 ≈ 0.115. To balance an external torque of ~8 N·m, muscle force must reach F = 8 / 0.035 ≈ 230 N, while the 2 kg load weighs only 19.6 N.',
    citation: 'Winter DA. Biomechanics and Motor Control of Human Movement, 4th Ed.',
  },
  {
    id: 'q3',
    category: 'Accessory Glides',
    question: 'According to Kaltenborn\'s convex-concave rule, what accessory glide at the glenohumeral joint is specifically indicated to restore abduction above 90°?',
    options: [
      'Superior (cephalad) glide of humeral head',
      'Inferior (caudal) glide of humeral head',
      'Anterior glide of humeral head',
      'Medial compression without traction',
    ],
    correctIndex: 1,
    explanation: 'The humeral head is convex moving within the concave glenoid fossa. In abduction, the humeral head rolls superiorly and must glide inferiorly (caudally) to prevent subacromial impingement against the coracoacromial arch.',
    citation: 'Kaltenborn FM. Manual Mobilization of the Joints, Vol I & II.',
  },
  {
    id: 'q4',
    category: 'End-Feel',
    question: 'What is the normal physiological end-feel encountered at the end of normal elbow extension (0°)?',
    options: [
      'Soft tissue approximation',
      'Hard (bony stop) as olecranon process enters olecranon fossa',
      'Capsular stretch with springy rebound',
      'Empty end-feel without resistance',
    ],
    correctIndex: 1,
    explanation: 'Normal elbow extension terminates with a definitive hard end-feel created by bony contact of the olecranon beak in the olecranon fossa of the humerus, backed by the anterior joint capsule.',
    citation: 'Magee DJ. Orthopedic Physical Assessment, 6th Ed.',
  },
  {
    id: 'q5',
    category: 'Prime Movers',
    question: 'In complete Axillary Nerve Palsy following anterior shoulder dislocation, which physiological motion is most critically impaired?',
    options: [
      'Elbow extension and wrist extension',
      'Shoulder abduction (middle deltoid) and lateral rotation (teres minor)',
      'Forearm pronation and thumb opposition',
      'Knee extension and hip flexion',
    ],
    correctIndex: 1,
    explanation: 'The axillary nerve (C5, C6) innervates all three heads of the Deltoid and the Teres Minor. Loss results in inability to initiate and maintain shoulder abduction beyond the initial 15° (supraspinatus) and severe weakness in external rotation.',
    citation: 'Hoppenfeld S. Physical Examination of the Spine and Extremities.',
  },
  {
    id: 'q6',
    category: '3D Spotting',
    question: 'Spotting Task: Identify the insertion of the Biceps Brachii tendon on the 3D model.',
    options: [
      'Radial tuberosity (on proximal medial radius)',
      'Coronoid process of ulna',
      'Greater tubercle of humerus',
      'Styloid process of radius',
    ],
    correctIndex: 0,
    explanation: 'The distal Biceps Brachii tendon inserts into the radial tuberosity. When the forearm is pronated, this tendon wraps around the radius; contraction unwinds the radius, generating powerful supination torque.',
    citation: 'Standring S. Gray\'s Anatomy, 42nd Ed.',
    isSpotting: true,
    spottingTarget: 'biceps_brachii',
  },
  {
    id: 'q7',
    category: '3D Spotting',
    question: 'Spotting Task: Identify the prime mover that inserts onto the Deltoid Tuberosity on the mid-lateral humerus.',
    options: [
      'Deltoid (Anterior, Middle, and Posterior heads)',
      'Supraspinatus',
      'Latissimus Dorsi',
      'Coracobrachialis',
    ],
    correctIndex: 0,
    explanation: 'The Deltoid converges into a strong V-shaped tendon inserting into the deltoid tuberosity on the lateral aspect of the shaft of the humerus.',
    citation: 'Gray\'s Anatomy; Holzbaur et al. (2005).',
    isSpotting: true,
    spottingTarget: 'mid_deltoid',
  },
  {
    id: 'q8',
    category: 'Biomechanics & Torque',
    question: 'What is the role of the patella in knee extension biomechanics?',
    options: [
      'Acts as an anatomical pulley that increases the quadriceps moment arm (r) from the knee axis',
      'Converts knee extension into a 2nd class lever',
      'Reduces joint reaction force to zero at 90° flexion',
      'Locks the tibia into internal rotation',
    ],
    correctIndex: 0,
    explanation: 'The patella holds the patellar tendon away from the tibiofemoral joint axis of rotation, increasing the mechanical moment arm by up to 30%, which significantly decreases the quadriceps force required to extend the knee.',
    citation: 'Nisell R. Mechanics of the knee. Acta Orthop Scand Suppl.',
  },
];
