require 'test_helper'

class HighlightsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @highlight = highlights(:one)
  end

  test "should get index" do
    get highlights_url, as: :json
    assert_response :success
  end

  test "should create highlight" do
    assert_difference('Highlight.count') do
      post highlights_url, params: { highlight: { resource_id: @highlight.resource_id, target: @highlight.target, uid: @highlight.uid } }, as: :json
    end

    assert_response 201
  end

  test "should show highlight" do
    get highlight_url(@highlight), as: :json
    assert_response :success
  end

  test "should update highlight" do
    patch highlight_url(@highlight), params: { highlight: { resource_id: @highlight.resource_id, target: @highlight.target, uid: @highlight.uid } }, as: :json
    assert_response 200
  end

  test "should destroy highlight" do
    assert_difference('Highlight.count', -1) do
      delete highlight_url(@highlight), as: :json
    end

    assert_response 204
  end
end
