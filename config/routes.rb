Rails.application.routes.draw do
  resources :links
  resources :highlights
  resources :resources
  resources :projects
  mount_devise_token_auth_for 'User', at: 'auth'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
