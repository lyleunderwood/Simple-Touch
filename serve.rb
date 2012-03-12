require 'rubygems'
require 'sinatra'

get '/' do
  File.read('index.html')
end

set :public_folder, File.dirname(__FILE__) + '/'