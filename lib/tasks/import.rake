require 'json_import'

namespace :import do   
   desc "Import from JSON"
      
   # TODO add task to run convert js script from rake 

   task :test => :environment do
      json_import = JSONImport.new
      json_import.load('http://tempdm2.s3-website-us-east-1.amazonaws.com/test.json', 'http://s3.amazonaws.com/tempdm2/app-images')
   end

   task :mappa => :environment do
      json_import = JSONImport.new
      json_import.load('http://tempdm2.s3-website-us-east-1.amazonaws.com/5.8.19-digitalmappa.json', 'http://s3.amazonaws.com/tempdm2/5.8.19-app-images')
   end
end
