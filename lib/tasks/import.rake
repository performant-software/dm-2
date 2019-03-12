require 'json_import'

namespace :import do   
   desc "Import from JSON"
      
   # TODO add task to run convert js script from rake 

   task :test => :environment do
      json_import = JSONImport.new
      json_import.load('ttl/test.json')
   end
end
