# Importing the necessary module
Import-Module PSUtil

# Filter processes to find ones containing "NukeShip-dev" in their name
$processes = Get-Process | Where-Object { $_.Name -like "*NukeShip-dev*" }

# Iterate through the matching processes
foreach ($process in $processes) {
    # Define the command arguments
    $cmd = @(
        '--listen=:65115',
        '--headless=true',
        '--api-version=2',
        '--check-go-version=false',
        '--only-same-user=false',
        'attach',
        $process.Id
    )
    # Execute the command
    Start-Process -NoNewWindow -FilePath "dlv" -ArgumentList $cmd -Wait
}