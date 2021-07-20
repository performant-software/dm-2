# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2021_07_19_143944) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_stat_statements"
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.bigint "byte_size", null: false
    t.string "checksum", null: false
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "document_folders", force: :cascade do |t|
    t.string "title"
    t.string "parent_type"
    t.bigint "parent_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "project_id"
    t.integer "position", default: 0
    t.index ["parent_type", "parent_id"], name: "index_document_folders_on_parent_type_and_parent_id"
    t.index ["project_id"], name: "index_document_folders_on_project_id"
  end

  create_table "documents", force: :cascade do |t|
    t.bigint "project_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "title"
    t.string "document_kind"
    t.string "parent_type"
    t.bigint "parent_id"
    t.jsonb "content"
    t.bigint "locked_by_id"
    t.boolean "locked", default: false, null: false
    t.string "search_text"
    t.integer "position", default: 0
    t.index ["locked_by_id"], name: "index_documents_on_locked_by_id"
    t.index ["parent_type", "parent_id"], name: "index_documents_on_parent_type_and_parent_id"
    t.index ["project_id"], name: "index_documents_on_project_id"
  end

  create_table "highlights", force: :cascade do |t|
    t.string "uid"
    t.string "target"
    t.bigint "document_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "excerpt"
    t.string "color"
    t.index ["document_id"], name: "index_highlights_on_document_id"
  end

  create_table "links", force: :cascade do |t|
    t.string "linkable_a_type"
    t.bigint "linkable_a_id"
    t.string "linkable_b_type"
    t.bigint "linkable_b_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "position", default: -1, null: false
    t.index ["linkable_a_type", "linkable_a_id"], name: "index_links_on_linkable_a_type_and_linkable_a_id"
    t.index ["linkable_b_type", "linkable_b_id"], name: "index_links_on_linkable_b_type_and_linkable_b_id"
  end

  create_table "projects", force: :cascade do |t|
    t.string "title"
    t.string "description"
    t.boolean "public"
    t.bigint "owner_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["owner_id"], name: "index_projects_on_owner_id"
  end

  create_table "user_project_permissions", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "project_id"
    t.string "permission"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_user_project_permissions_on_project_id"
    t.index ["user_id", "project_id"], name: "index_user_project_permissions_on_user_id_and_project_id", unique: true
    t.index ["user_id"], name: "index_user_project_permissions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "provider", default: "email", null: false
    t.string "uid", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.boolean "allow_password_change", default: false
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.string "name"
    t.string "nickname"
    t.string "image"
    t.string "email"
    t.json "tokens"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "approved", default: false, null: false
    t.boolean "admin", default: false, null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["uid", "provider"], name: "index_users_on_uid_and_provider", unique: true
  end

  add_foreign_key "document_folders", "projects"
  add_foreign_key "documents", "projects"
  add_foreign_key "highlights", "documents"
end
