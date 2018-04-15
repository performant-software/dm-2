require 'test_helper'

class DocumentFoldersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @document_folder = document_folders(:one)
  end

  test "should get index" do
    get document_folders_url, as: :json
    assert_response :success
  end

  test "should create document_folder" do
    assert_difference('DocumentFolder.count') do
      post document_folders_url, params: { document_folder: { created_by_id: @document_folder.created_by_id, parent_id: @document_folder.parent_id, title: @document_folder.title } }, as: :json
    end

    assert_response 201
  end

  test "should show document_folder" do
    get document_folder_url(@document_folder), as: :json
    assert_response :success
  end

  test "should update document_folder" do
    patch document_folder_url(@document_folder), params: { document_folder: { created_by_id: @document_folder.created_by_id, parent_id: @document_folder.parent_id, title: @document_folder.title } }, as: :json
    assert_response 200
  end

  test "should destroy document_folder" do
    assert_difference('DocumentFolder.count', -1) do
      delete document_folder_url(@document_folder), as: :json
    end

    assert_response 204
  end
end
