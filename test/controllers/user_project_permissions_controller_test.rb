require 'test_helper'

class UserProjectPermissionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user_project_permission = user_project_permissions(:one)
  end

  test "should get index" do
    get user_project_permissions_url, as: :json
    assert_response :success
  end

  test "should create user_project_permission" do
    assert_difference('UserProjectPermission.count') do
      post user_project_permissions_url, params: { user_project_permission: { permission: @user_project_permission.permission, references: @user_project_permission.references } }, as: :json
    end

    assert_response 201
  end

  test "should show user_project_permission" do
    get user_project_permission_url(@user_project_permission), as: :json
    assert_response :success
  end

  test "should update user_project_permission" do
    patch user_project_permission_url(@user_project_permission), params: { user_project_permission: { permission: @user_project_permission.permission, references: @user_project_permission.references } }, as: :json
    assert_response 200
  end

  test "should destroy user_project_permission" do
    assert_difference('UserProjectPermission.count', -1) do
      delete user_project_permission_url(@user_project_permission), as: :json
    end

    assert_response 204
  end
end
