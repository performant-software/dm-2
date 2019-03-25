require 'json_import'

namespace :import do   
   desc "Import from JSON"
      
   # TODO add task to run convert js script from rake 

   task :test => :environment do
      json_import = JSONImport.new
      json_import.load('ttl/test.json', 'ttl/images')
   end

   task :mappa => :environment do
      json_import = JSONImport.new
      json_import.load('ttl/test-mappa.json', 'ttl/app-images')
   end
end
