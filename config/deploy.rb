# config valid only for Capistrano 3.1
lock '3.5.0'

set :application, 'gam'
# set :repo_url, 'git@github.com:gre-foundation/gre-gam.git'
set :scm, :copy
set :exclude_dir, "{.svn,.git,vendo,tmp,lib,logs,Gemfile,Gemfile.*,Capfile,Uploads,runtime,tests,node_modules}"

# Default branch is :master
# ask :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }.call

# Default deploy_to directory is /var/www/my_app
set :deploy_to, '/data/website/payment-gateway'

# Default value for :scm is :git
# set :scm, :git

# Default value for :format is :pretty
# set :format, :pretty

# Default value for :log_level is :debug
# set :log_level, :debug

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
# set :linked_files, %w{config/database.yml}

# Default value for linked_dirs is []
# set :linked_dirs, %w{bin log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5

set :format, :pretty
set :log_level, :debug
set :keep_releases, 5
set :use_sudo, true

namespace :deploy do
  desc 'Restart application'
  task :restart do
    on roles(:all) do
      puts "restart app"
      execute :ln, "-sf", "#{shared_path}/node_modules", "#{current_path}/node_modules"

      execute :mkdir, "-p", "#{shared_path}/logs"
      execute :ln, "-sf", "#{shared_path}/logs", "#{current_path}/logs"

      execute :mkdir, "-p", "#{shared_path}/tmp"
      execute :ln, "-sf", "#{shared_path}/tmp", "#{current_path}/tmp"

    end
  end

  after :publishing, :restart
end
