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
      json_import.load('http://tempdm2.s3-website-us-east-1.amazonaws.com/Virtual_mappa.json', 'http://s3.amazonaws.com/tempdm2/Virtual_mappa')
   end

   task :sims => :environment do
      json_import = JSONImport.new
      json_import.load('http://tempdm2.s3-website-us-east-1.amazonaws.com/sims.json', 'http://s3.amazonaws.com/tempdm2/sims_images')
   end

end
