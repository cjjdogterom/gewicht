/* Oefeningenbibliotheek — naam, spiergroep, materiaal */

const SPIERGROEPEN = ['Borst', 'Rug', 'Schouders', 'Biceps', 'Triceps', 'Benen', 'Billen', 'Core', 'Cardio', 'Overig'];

const OEFENINGEN = [
  // Borst
  { naam: 'Bench Press (barbell)', spier: 'Borst', mat: 'Barbell' },
  { naam: 'Bench Press (dumbbell)', spier: 'Borst', mat: 'Dumbbell' },
  { naam: 'Incline Bench Press (barbell)', spier: 'Borst', mat: 'Barbell' },
  { naam: 'Incline Bench Press (dumbbell)', spier: 'Borst', mat: 'Dumbbell' },
  { naam: 'Decline Bench Press', spier: 'Borst', mat: 'Barbell' },
  { naam: 'Chest Press (machine)', spier: 'Borst', mat: 'Machine' },
  { naam: 'Chest Fly (machine)', spier: 'Borst', mat: 'Machine' },
  { naam: 'Chest Fly (dumbbell)', spier: 'Borst', mat: 'Dumbbell' },
  { naam: 'Cable Fly', spier: 'Borst', mat: 'Kabel' },
  { naam: 'Push-up', spier: 'Borst', mat: 'Lichaamsgewicht' },
  { naam: 'Dips', spier: 'Borst', mat: 'Lichaamsgewicht' },

  // Rug
  { naam: 'Deadlift', spier: 'Rug', mat: 'Barbell' },
  { naam: 'Pull-up', spier: 'Rug', mat: 'Lichaamsgewicht' },
  { naam: 'Chin-up', spier: 'Rug', mat: 'Lichaamsgewicht' },
  { naam: 'Lat Pulldown', spier: 'Rug', mat: 'Kabel' },
  { naam: 'Lat Pulldown (close grip)', spier: 'Rug', mat: 'Kabel' },
  { naam: 'Seated Cable Row', spier: 'Rug', mat: 'Kabel' },
  { naam: 'Bent-over Row (barbell)', spier: 'Rug', mat: 'Barbell' },
  { naam: 'Row (dumbbell)', spier: 'Rug', mat: 'Dumbbell' },
  { naam: 'T-Bar Row', spier: 'Rug', mat: 'Barbell' },
  { naam: 'Row (machine)', spier: 'Rug', mat: 'Machine' },
  { naam: 'Face Pull', spier: 'Rug', mat: 'Kabel' },
  { naam: 'Straight-arm Pulldown', spier: 'Rug', mat: 'Kabel' },
  { naam: 'Back Extension', spier: 'Rug', mat: 'Lichaamsgewicht' },
  { naam: 'Shrug (dumbbell)', spier: 'Rug', mat: 'Dumbbell' },
  { naam: 'Shrug (barbell)', spier: 'Rug', mat: 'Barbell' },

  // Schouders
  { naam: 'Overhead Press (barbell)', spier: 'Schouders', mat: 'Barbell' },
  { naam: 'Shoulder Press (dumbbell)', spier: 'Schouders', mat: 'Dumbbell' },
  { naam: 'Shoulder Press (machine)', spier: 'Schouders', mat: 'Machine' },
  { naam: 'Lateral Raise (dumbbell)', spier: 'Schouders', mat: 'Dumbbell' },
  { naam: 'Lateral Raise (kabel)', spier: 'Schouders', mat: 'Kabel' },
  { naam: 'Lateral Raise (machine)', spier: 'Schouders', mat: 'Machine' },
  { naam: 'Front Raise', spier: 'Schouders', mat: 'Dumbbell' },
  { naam: 'Rear Delt Fly (dumbbell)', spier: 'Schouders', mat: 'Dumbbell' },
  { naam: 'Rear Delt Fly (machine)', spier: 'Schouders', mat: 'Machine' },
  { naam: 'Arnold Press', spier: 'Schouders', mat: 'Dumbbell' },
  { naam: 'Upright Row', spier: 'Schouders', mat: 'Barbell' },

  // Biceps
  { naam: 'Biceps Curl (dumbbell)', spier: 'Biceps', mat: 'Dumbbell' },
  { naam: 'Biceps Curl (barbell)', spier: 'Biceps', mat: 'Barbell' },
  { naam: 'Biceps Curl (kabel)', spier: 'Biceps', mat: 'Kabel' },
  { naam: 'Hammer Curl', spier: 'Biceps', mat: 'Dumbbell' },
  { naam: 'Incline Curl', spier: 'Biceps', mat: 'Dumbbell' },
  { naam: 'Preacher Curl', spier: 'Biceps', mat: 'Barbell' },
  { naam: 'Concentration Curl', spier: 'Biceps', mat: 'Dumbbell' },
  { naam: 'EZ-bar Curl', spier: 'Biceps', mat: 'Barbell' },

  // Triceps
  { naam: 'Triceps Pushdown (kabel)', spier: 'Triceps', mat: 'Kabel' },
  { naam: 'Triceps Pushdown (touw)', spier: 'Triceps', mat: 'Kabel' },
  { naam: 'Overhead Triceps Extension', spier: 'Triceps', mat: 'Kabel' },
  { naam: 'Skullcrusher', spier: 'Triceps', mat: 'Barbell' },
  { naam: 'Triceps Extension (dumbbell)', spier: 'Triceps', mat: 'Dumbbell' },
  { naam: 'Close-grip Bench Press', spier: 'Triceps', mat: 'Barbell' },
  { naam: 'Triceps Dip (machine)', spier: 'Triceps', mat: 'Machine' },
  { naam: 'Bench Dip', spier: 'Triceps', mat: 'Lichaamsgewicht' },

  // Benen
  { naam: 'Squat (barbell)', spier: 'Benen', mat: 'Barbell' },
  { naam: 'Front Squat', spier: 'Benen', mat: 'Barbell' },
  { naam: 'Goblet Squat', spier: 'Benen', mat: 'Dumbbell' },
  { naam: 'Leg Press', spier: 'Benen', mat: 'Machine' },
  { naam: 'Hack Squat', spier: 'Benen', mat: 'Machine' },
  { naam: 'Leg Extension', spier: 'Benen', mat: 'Machine' },
  { naam: 'Leg Curl (liggend)', spier: 'Benen', mat: 'Machine' },
  { naam: 'Leg Curl (zittend)', spier: 'Benen', mat: 'Machine' },
  { naam: 'Romanian Deadlift', spier: 'Benen', mat: 'Barbell' },
  { naam: 'Romanian Deadlift (dumbbell)', spier: 'Benen', mat: 'Dumbbell' },
  { naam: 'Lunge (dumbbell)', spier: 'Benen', mat: 'Dumbbell' },
  { naam: 'Walking Lunge', spier: 'Benen', mat: 'Dumbbell' },
  { naam: 'Bulgarian Split Squat', spier: 'Benen', mat: 'Dumbbell' },
  { naam: 'Calf Raise (staand)', spier: 'Benen', mat: 'Machine' },
  { naam: 'Calf Raise (zittend)', spier: 'Benen', mat: 'Machine' },
  { naam: 'Step-up', spier: 'Benen', mat: 'Dumbbell' },

  // Billen
  { naam: 'Hip Thrust (barbell)', spier: 'Billen', mat: 'Barbell' },
  { naam: 'Hip Thrust (machine)', spier: 'Billen', mat: 'Machine' },
  { naam: 'Glute Kickback (kabel)', spier: 'Billen', mat: 'Kabel' },
  { naam: 'Abductor (machine)', spier: 'Billen', mat: 'Machine' },
  { naam: 'Adductor (machine)', spier: 'Billen', mat: 'Machine' },
  { naam: 'Glute Bridge', spier: 'Billen', mat: 'Lichaamsgewicht' },
  { naam: 'Sumo Deadlift', spier: 'Billen', mat: 'Barbell' },

  // Core
  { naam: 'Plank', spier: 'Core', mat: 'Lichaamsgewicht' },
  { naam: 'Side Plank', spier: 'Core', mat: 'Lichaamsgewicht' },
  { naam: 'Crunch', spier: 'Core', mat: 'Lichaamsgewicht' },
  { naam: 'Cable Crunch', spier: 'Core', mat: 'Kabel' },
  { naam: 'Sit-up', spier: 'Core', mat: 'Lichaamsgewicht' },
  { naam: 'Leg Raise (hangend)', spier: 'Core', mat: 'Lichaamsgewicht' },
  { naam: 'Leg Raise (liggend)', spier: 'Core', mat: 'Lichaamsgewicht' },
  { naam: 'Russian Twist', spier: 'Core', mat: 'Lichaamsgewicht' },
  { naam: 'Ab Wheel Rollout', spier: 'Core', mat: 'Overig' },
  { naam: 'Dead Bug', spier: 'Core', mat: 'Lichaamsgewicht' },
  { naam: 'Mountain Climber', spier: 'Core', mat: 'Lichaamsgewicht' },

  // Cardio
  { naam: 'Hardlopen (buiten)', spier: 'Cardio', mat: 'Overig' },
  { naam: 'Loopband', spier: 'Cardio', mat: 'Machine' },
  { naam: 'Fietsen (buiten)', spier: 'Cardio', mat: 'Overig' },
  { naam: 'Hometrainer', spier: 'Cardio', mat: 'Machine' },
  { naam: 'Roeien (machine)', spier: 'Cardio', mat: 'Machine' },
  { naam: 'Crosstrainer', spier: 'Cardio', mat: 'Machine' },
  { naam: 'Stairmaster', spier: 'Cardio', mat: 'Machine' },
  { naam: 'Touwtje springen', spier: 'Cardio', mat: 'Overig' },
  { naam: 'Wandelen', spier: 'Cardio', mat: 'Overig' },
  { naam: 'Zwemmen', spier: 'Cardio', mat: 'Overig' },

  // Overig
  { naam: 'Farmer’s Walk', spier: 'Overig', mat: 'Dumbbell' },
  { naam: 'Kettlebell Swing', spier: 'Overig', mat: 'Overig' },
  { naam: 'Wrist Curl', spier: 'Overig', mat: 'Dumbbell' },
  { naam: 'Neck Curl', spier: 'Overig', mat: 'Overig' }
];

function alleOefeningen() {
  return [...OEFENINGEN, ...App.eigenOefeningen.map(e => ({ naam: e.naam, spier: e.spier, mat: e.mat, eigen: true }))];
}

function zoekOefening(naam) {
  return alleOefeningen().find(o => o.naam === naam) || { naam, spier: 'Overig', mat: 'Overig' };
}
