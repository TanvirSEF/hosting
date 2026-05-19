<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
define('API_SECRET_KEY', 'K7mN9pQ2vX5wZ8bD4fG6hJ3kL1nR0sT7uV9xY2zA5cE8gI3mP6qS9tW2yB5eH8jK1nQ4rT7v');
$providedKey = $_GET['key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($providedKey !== API_SECRET_KEY) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized - Invalid API key'
    ]);
    exit;
}
$country = $_GET['country'] ?? '';
$state = $_GET['state'] ?? '';
if (empty($country)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing required parameter: country'
    ]);
    exit;
}
require_once(__DIR__ . '/../configuration.php');
try {
    $port = !empty($db_port) && is_numeric($db_port) ? (int) $db_port : null;
    $mysqli = new mysqli($db_host, $db_username, $db_password, $db_name, $port);
    if ($mysqli->connect_error) {
        throw new Exception('Database connection failed: ' . $mysqli->connect_error);
    }
    $query = " SELECT level, name, taxrate, country, state FROM tbltax WHERE (country = ? OR country = '') ";
    $params = [$country];
    $types = 's';
    if (!empty($state)) {
        $query .= " AND (state = ? OR state = '')";
        $params[] = $state;
        $types .= 's';
    } else {
        $query .= " AND state = ''";
    }
    $query .= " ORDER BY CASE WHEN country != '' THEN 1 ELSE 2 END, CASE WHEN state != '' THEN 1 ELSE 2 END, level ASC ";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $taxRules = [];
    while ($row = $result->fetch_assoc()) {
        $taxRules[] = $row;
    }
    $stmt->close();
    $mysqli->close();
    if (empty($taxRules)) {
        echo json_encode([
            'success' => true,
            'data' => [
                'taxrate' => 0,
                'taxrate2' => 0,
                'taxname' => 'VAT',
                'taxname2' => ''
            ],
            'message' => 'No tax rules found for ' . $country
        ]);
        exit;
    }
    $level1 = null;
    $level2 = null;
    $hasSpecificCountryRule = false;
    foreach ($taxRules as $rule) {
        if (!empty($rule['country']) && $rule['country'] == $country) {
            $hasSpecificCountryRule = true;
            break;
        }
    }
    foreach ($taxRules as $rule) {
        if ($hasSpecificCountryRule && empty($rule['country'])) {
            continue;
        }
        if ($rule['level'] == '1') {
            if ($level1 === null) {
                $level1 = $rule;
            }
        }
        // Level 2 tax 
        /*
        elseif ($rule['level'] == '2') {
            if ($level2 === null) {
                $level2 = $rule;
            }
        }
        */
    }
    echo json_encode([
        'success' => true,
        'data' => [
            'taxrate' => $level1 ? (float) $level1['taxrate'] : 0,
            'taxrate2' => $level2 ? (float) $level2['taxrate'] : 0,
            'taxname' => $level1['name'] ?? 'VAT',
            'taxname2' => $level2['name'] ?? ''
        ],
        'query' => [
            'country' => $country,
            'state' => $state
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}