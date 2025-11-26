<?php
// scores.php
header('Content-Type: application/json');

$file = __DIR__ . '/scores.json';
if (!file_exists($file)) {
  file_put_contents($file, json_encode([]));
}

$method = $_SERVER['REQUEST_METHOD'];

// Load current scores
$scores = json_decode(file_get_contents($file), true);
if (!is_array($scores)) {
  $scores = [];
}

if ($method === 'POST') {
  // Read JSON body
  $input = json_decode(file_get_contents('php://input'), true);
  if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
  }

  $name  = isset($input['name'])  ? trim($input['name'])  : 'Anon';
  $score = isset($input['score']) ? intval($input['score']) : 0;

  // Basic sanity limits
  $name  = substr($name, 0, 16);     // max 16 chars
  if ($score < 0) $score = 0;

  $scores[] = [
    'name' => $name,
    'score' => $score,
    'time' => time()
  ];

  // Sort by score desc
  usort($scores, function($a, $b) {
    return $b['score'] <=> $a['score'];
  });

  // Keep only top 20
  $scores = array_slice($scores, 0, 20);

  file_put_contents($file, json_encode($scores));

  echo json_encode($scores);
  exit;
}

if ($method === 'GET') {
  echo json_encode($scores);
  exit;
}

// Anything else
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
