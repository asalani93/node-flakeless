{
  "targets": [
    {
      "target_name": "flakeless",
      "sources": [ "src/addon.cc", "src/flakeless.cc" ] ,
      "include_dirs": [ "<!(node -e \"require('nan')\")" ]
    }
  ]
}
