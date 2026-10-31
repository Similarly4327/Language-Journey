param([Parameter(Mandatory=$true)][string]$WorkbookPath)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=$null
try {
  $archive=[IO.Compression.ZipFile]::OpenRead([IO.Path]::GetFullPath($WorkbookPath))
  if (($archive.Entries | Measure-Object -Property Length -Sum).Sum -gt 33554432) { throw 'Workbook too large' }
  function Read-Xml([string]$Name) {
    $entry=$archive.GetEntry($Name)
    if (!$entry) { throw 'Missing workbook member' }
    $settings=New-Object System.Xml.XmlReaderSettings
    $settings.DtdProcessing=[System.Xml.DtdProcessing]::Prohibit
    $settings.XmlResolver=$null
    $stream=$entry.Open()
    try {
      $reader=[System.Xml.XmlReader]::Create($stream,$settings)
      try { $doc=New-Object System.Xml.XmlDocument; $doc.XmlResolver=$null; $doc.Load($reader); return ,$doc }
      finally { $reader.Dispose() }
    } finally { $stream.Dispose() }
  }
  $strings=New-Object 'System.Collections.Generic.List[string]'
  if ($archive.GetEntry('xl/sharedStrings.xml')) {
    foreach ($item in (Read-Xml 'xl/sharedStrings.xml').SelectNodes('//*[local-name()="si"]')) {
      $strings.Add(($item.SelectNodes('.//*[local-name()="t"]') | ForEach-Object {$_.InnerText}) -join '')
    }
  }
  $relations=@{}
  foreach ($item in (Read-Xml 'xl/_rels/workbook.xml.rels').DocumentElement.ChildNodes) { $relations[$item.Id]=$item.Target }
  $sheets=@{}
  foreach ($sheet in (Read-Xml 'xl/workbook.xml').SelectNodes('//*[local-name()="sheet"]')) {
    $name=$sheet.GetAttribute('name')
    if ($name -notin @('Overzicht','Woorden','Zinnen','Dialogen','Stemmen','Codex')) { continue }
    $rid=$sheet.GetAttribute('id','http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $target=[string]$relations[$rid]
    $member=if ($target.StartsWith('/')) {$target.TrimStart('/')} else {'xl/'+$target}
    if (!$member.StartsWith('xl/') -or $member.Contains('..')) { throw 'Invalid sheet path' }
    $rows=New-Object 'System.Collections.Generic.List[object]'
    foreach ($sourceRow in (Read-Xml $member).SelectNodes('//*[local-name()="sheetData"]/*[local-name()="row"]')) {
      $row=New-Object 'System.Collections.Generic.List[string]'
      foreach ($cell in $sourceRow.SelectNodes('./*[local-name()="c"]')) {
        if ($cell.r -notmatch '^([A-Z]{1,3})[0-9]+$') { throw 'Invalid cell address' }
        $column=0; foreach ($character in $Matches[1].ToCharArray()) {$column=$column*26+[int]$character-64}
        if ($column -gt 40) { continue }
        $valueNode=$cell.SelectSingleNode('./*[local-name()="v"]')
        $value=if ($valueNode) {$valueNode.InnerText} else {''}
        if ($cell.t -eq 's') {$value=$strings[[int]$value]}
        elseif ($cell.t -eq 'inlineStr') {$value=($cell.SelectNodes('./*[local-name()="is"]//*[local-name()="t"]') | ForEach-Object {$_.InnerText}) -join ''}
        while ($row.Count -lt $column) {$row.Add('')}
        $row[$column-1]=[string]$value
      }
      $rows.Add($row.ToArray())
    }
    $sheets[$name]=$rows.ToArray()
  }
  if ($sheets.Count -ne 6) { throw 'Missing tabs' }
  @{schemaVersion=1;sheets=$sheets} | ConvertTo-Json -Depth 10 -Compress
} catch { [Console]::Error.WriteLine('Invalid local backlog workbook'); exit 1 }
finally { if ($archive) {$archive.Dispose()} }
