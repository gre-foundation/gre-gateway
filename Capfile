$: << File.expand_path('../lib',__FILE__)

# Load DSL and Setup Up Stages
require 'capistrano/setup'

# Includes default deployment tasks
require 'capistrano/deploy'

require 'rubygems'
require 'bundler'
Bundler.require

require 'capistrano-scm-copy'


Dir.glob('lib/capistrano/tasks/*.rake').each { |r| import r }
