Rails.application.routes.draw do
  resources :user_project_permissions, except: :index
  resources :document_folders, except: :index
  resources :documents, except: :index
  resources :links, except: [:index, :update]
  resources :highlights, except: :index
  resources :projects
  mount_devise_token_auth_for 'User', at: '/auth'

  get '/users/update'
  get '/users/list_admin' => 'users#list_admin'
  patch '/users/:id' => 'users#admin_update'
  delete '/users/:id' => 'users#destroy'
  post '/highlights/duplicate' => 'highlights#duplicate'
  post '/highlights/:id/set_thumbnail' => 'highlights#set_thumbnail'
  post '/documents/:id/set_thumbnail' => 'documents#set_thumbnail'
  put '/documents/:id/add_images' => 'documents#add_images'
  patch '/documents/:id/lock' => 'documents#lock'
  patch '/documents/:id/move' => 'documents#move'
  patch '/document_folders/:id/move' => 'document_folders#move'
  post '/document_folders/:id/add_tree' => 'document_folders#add_tree'
  get '/projects/:id/search' => 'projects#search'
  post '/projects/:id/check_in' => 'projects#check_in'
  patch '/links/:id/move' => 'links#move'
  patch '/documents/:id/move_layer' => 'documents#move_layer'
  patch '/documents/:id/delete_layer' => 'documents#delete_layer'

  get '*path', to: "application#fallback_index_html", constraints: ->(request) do
    !request.xhr? && request.format.html?
  end
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
